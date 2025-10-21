import { supabase } from './supabase';

export interface UserPath {
  id: string;
  path_signature: string;
  path_sequence: string[];
  occurrence_count: number;
  average_duration: string;
  success_rate: number;
  last_occurred: string;
}

export interface PathCluster {
  id: string;
  cluster_name: string;
  path_pattern: string[];
  paths_count: number;
  total_occurrences: number;
  average_success_rate: number;
  average_duration: string;
}

export interface SessionPath {
  session_id: string;
  user_id: string;
  path_sequence: string[];
  duration: number;
  completed: boolean;
}

/**
 * Extract unique paths from user sessions
 */
export async function extractSessionPaths(sessionIds: string[]): Promise<SessionPath[]> {
  const { data: events, error } = await supabase
    .from('user_events')
    .select('session_id, user_id, screen_name, timestamp')
    .in('session_id', sessionIds)
    .eq('event_type', 'navigation')
    .order('timestamp', { ascending: true });

  if (error || !events) {
    console.error('Failed to fetch session events:', error);
    return [];
  }

  // Group by session
  const sessionMap = new Map<string, typeof events>();
  events.forEach(event => {
    if (!sessionMap.has(event.session_id)) {
      sessionMap.set(event.session_id, []);
    }
    sessionMap.get(event.session_id)!.push(event);
  });

  // Create path objects
  const paths: SessionPath[] = [];
  sessionMap.forEach((sessionEvents, sessionId) => {
    if (sessionEvents.length < 2) return; // Skip single-screen sessions

    const path_sequence = sessionEvents.map(e => e.screen_name);
    const startTime = new Date(sessionEvents[0].timestamp).getTime();
    const endTime = new Date(sessionEvents[sessionEvents.length - 1].timestamp).getTime();
    const duration = endTime - startTime;

    // Check if session completed successfully (ended on orders or order-details)
    const lastScreen = path_sequence[path_sequence.length - 1];
    const completed = lastScreen === 'orders' || lastScreen === 'order-details';

    paths.push({
      session_id: sessionId,
      user_id: sessionEvents[0].user_id,
      path_sequence,
      duration,
      completed,
    });
  });

  return paths;
}

/**
 * Update or create path in database
 */
export async function updatePathStats(path: SessionPath): Promise<void> {
  const path_signature = path.path_sequence.join('->');

  // Check if path exists
  const { data: existingPath } = await supabase
    .from('user_paths')
    .select('*')
    .eq('path_signature', path_signature)
    .maybeSingle();

  if (existingPath) {
    // Update existing path
    const newCount = existingPath.occurrence_count + 1;
    const oldAvgMs = parseInterval(existingPath.average_duration);
    const newAvgMs = (oldAvgMs * existingPath.occurrence_count + path.duration) / newCount;
    const oldSuccessRate = existingPath.success_rate || 0;
    const successCount = Math.round((oldSuccessRate / 100) * existingPath.occurrence_count);
    const newSuccessCount = successCount + (path.completed ? 1 : 0);
    const newSuccessRate = (newSuccessCount / newCount) * 100;

    await supabase
      .from('user_paths')
      .update({
        occurrence_count: newCount,
        average_duration: `${Math.round(newAvgMs)} milliseconds`,
        success_rate: newSuccessRate,
        last_occurred: new Date().toISOString(),
      })
      .eq('id', existingPath.id);
  } else {
    // Create new path
    await supabase
      .from('user_paths')
      .insert({
        path_signature,
        path_sequence: path.path_sequence,
        occurrence_count: 1,
        average_duration: `${path.duration} milliseconds`,
        success_rate: path.completed ? 100 : 0,
        last_occurred: new Date().toISOString(),
      });
  }
}

/**
 * Calculate similarity between two paths using Longest Common Subsequence
 */
export function calculatePathSimilarity(path1: string[], path2: string[]): number {
  const len1 = path1.length;
  const len2 = path2.length;

  if (len1 === 0 || len2 === 0) return 0;

  // Dynamic programming LCS
  const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (path1[i - 1] === path2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[len1][len2];
  const maxLength = Math.max(len1, len2);

  return (lcsLength / maxLength) * 100;
}

/**
 * Cluster similar paths together
 */
export async function clusterPaths(similarityThreshold: number = 70): Promise<void> {
  // Fetch all paths
  const { data: paths, error } = await supabase
    .from('user_paths')
    .select('*')
    .order('occurrence_count', { ascending: false });

  if (error || !paths || paths.length === 0) {
    console.error('Failed to fetch paths for clustering:', error);
    return;
  }

  // Clear existing clusters
  await supabase.from('path_cluster_members').delete().neq('cluster_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('path_clusters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const clusters: Array<{
    paths: UserPath[];
    pattern: string[];
  }> = [];

  // Simple clustering algorithm
  for (const path of paths) {
    let addedToCluster = false;

    // Try to add to existing cluster
    for (const cluster of clusters) {
      const similarities = cluster.paths.map(p =>
        calculatePathSimilarity(path.path_sequence, p.path_sequence)
      );
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      if (avgSimilarity >= similarityThreshold) {
        cluster.paths.push(path);
        addedToCluster = true;
        break;
      }
    }

    // Create new cluster if not added
    if (!addedToCluster) {
      clusters.push({
        paths: [path],
        pattern: [...path.path_sequence],
      });
    }
  }

  // Save clusters to database
  for (const cluster of clusters) {
    if (cluster.paths.length === 0) continue;

    // Calculate cluster statistics
    const totalOccurrences = cluster.paths.reduce((sum, p) => sum + p.occurrence_count, 0);
    const avgSuccessRate = cluster.paths.reduce((sum, p) => sum + p.success_rate * p.occurrence_count, 0) / totalOccurrences;
    const avgDurationMs = cluster.paths.reduce((sum, p) => sum + parseInterval(p.average_duration) * p.occurrence_count, 0) / totalOccurrences;

    // Generate cluster name
    const clusterName = generateClusterName(cluster.pattern);

    // Insert cluster
    const { data: insertedCluster, error: clusterError } = await supabase
      .from('path_clusters')
      .insert({
        cluster_name: clusterName,
        path_pattern: cluster.pattern,
        paths_count: cluster.paths.length,
        total_occurrences: totalOccurrences,
        average_success_rate: avgSuccessRate,
        average_duration: `${Math.round(avgDurationMs)} milliseconds`,
      })
      .select()
      .single();

    if (clusterError || !insertedCluster) {
      console.error('Failed to insert cluster:', clusterError);
      continue;
    }

    // Add cluster members
    for (const path of cluster.paths) {
      const similarity = calculatePathSimilarity(path.path_sequence, cluster.pattern);
      await supabase
        .from('path_cluster_members')
        .insert({
          cluster_id: insertedCluster.id,
          path_id: path.id,
          similarity_score: similarity,
        });
    }
  }
}

/**
 * Generate a human-readable name for a cluster based on its pattern
 */
function generateClusterName(pattern: string[]): string {
  const patternStr = pattern.join(' → ');

  if (pattern.includes('voice') || pattern.includes('new-order')) {
    return `Order Creation Flow (${patternStr})`;
  } else if (pattern.includes('prices') || pattern.includes('price-list')) {
    return `Price List Browse Flow (${patternStr})`;
  } else if (pattern.includes('edit') || pattern.includes('edit-draft')) {
    return `Order Editing Flow (${patternStr})`;
  } else if (pattern.includes('copy')) {
    return `Copy Order Flow (${patternStr})`;
  } else if (pattern.includes('order-details')) {
    return `Order Review Flow (${patternStr})`;
  } else {
    return `User Path (${patternStr})`;
  }
}

/**
 * Parse PostgreSQL interval to milliseconds
 */
function parseInterval(interval: string): number {
  if (!interval) return 0;

  const parts = interval.split(' ');
  if (parts.length < 2) return 0;

  const value = parseFloat(parts[0]);
  const unit = parts[1];

  switch (unit) {
    case 'milliseconds':
    case 'millisecond':
      return value;
    case 'seconds':
    case 'second':
      return value * 1000;
    case 'minutes':
    case 'minute':
      return value * 60 * 1000;
    case 'hours':
    case 'hour':
      return value * 60 * 60 * 1000;
    case 'days':
    case 'day':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Process recent sessions and update path statistics
 */
export async function processRecentSessions(hoursBack: number = 1): Promise<void> {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('id')
    .gte('session_start', cutoffTime);

  if (error || !sessions) {
    console.error('Failed to fetch recent sessions:', error);
    return;
  }

  const sessionIds = sessions.map(s => s.id);
  if (sessionIds.length === 0) return;

  const paths = await extractSessionPaths(sessionIds);

  for (const path of paths) {
    await updatePathStats(path);
  }

  // Re-cluster after adding new paths
  await clusterPaths();
}
