const originalError = console.error;

console.error = (...args) => {
    originalError(...args);
};
