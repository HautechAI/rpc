module.exports = {
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
};
