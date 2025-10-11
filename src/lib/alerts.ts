export function showAlert(message: string, variant: 'success' | 'error' | 'info' = 'info') {
  const colors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-red-600',
    info: 'from-blue-500 to-blue-600',
  };

  const icons = {
    success: `<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
    </svg>`,
    error: `<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    info: `<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
  };

  const alertElement = document.createElement('div');
  alertElement.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in';
  alertElement.innerHTML = `
    <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 animate-scale-in">
      <div class="text-center">
        <div class="w-20 h-20 bg-gradient-to-r ${colors[variant]} rounded-full flex items-center justify-center mx-auto mb-4">
          ${icons[variant]}
        </div>
        <p class="text-gray-800 text-lg font-medium">${message}</p>
      </div>
    </div>
  `;

  document.body.appendChild(alertElement);

  setTimeout(() => {
    alertElement.remove();
  }, 2000);
}
