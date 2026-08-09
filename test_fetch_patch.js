
try {
  console.log('Testing defineProperty on window.fetch');
  const d = Object.getOwnPropertyDescriptor(window, 'fetch');
  console.log('Descriptor:', d);
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    get: () => () => {},
  });
  console.log('Successfully redefined window.fetch');
} catch (e) {
  console.error('Failed to redefine window.fetch:', e);
}
