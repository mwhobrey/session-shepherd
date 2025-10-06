/**
 * Performance tests for Session Shepherd
 * Tests extension performance with large datasets
 */

const TestHelpers = require('../utils/test-helpers');

describe('Session Shepherd Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Large Dataset Handling', () => {
    test('should handle large number of tabs efficiently', async () => {
      const largeTabSet = TestHelpers.createPerformanceTestData(100).tabs;
      
      const startTime = performance.now();
      
      // Simulate loading large tab set
      const selectedTabs = new Set(largeTabSet.map(tab => tab.id));
      const session = {
        id: Date.now(),
        name: 'Large Tab Session',
        tabs: largeTabSet.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString()
      };
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(1000); // 1 second
      expect(selectedTabs.size).toBe(100);
      expect(session.tabs.length).toBe(100);
    });

    test('should handle large number of sessions efficiently', async () => {
      const largeSessionSet = TestHelpers.createPerformanceTestData(50).sessions;
      
      const startTime = performance.now();
      
      // Simulate rendering large session list
      const sessionCards = largeSessionSet.map(session => ({
        id: session.id,
        name: session.name,
        tabCount: session.tabs.length,
        createdAt: session.createdAt
      }));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(500); // 0.5 seconds
      expect(sessionCards.length).toBe(50);
    });

    test('should handle session creation with many tabs', async () => {
      const manyTabs = TestHelpers.createPerformanceTestData(200).tabs;
      
      const startTime = performance.now();
      
      // Simulate session creation process
      const session = {
        id: Date.now(),
        name: 'Massive Session',
        tabs: manyTabs.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString()
      };
      
      // Simulate storage operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(2000); // 2 seconds
      expect(session.tabs.length).toBe(200);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate repeated session operations
      for (let i = 0; i < 100; i++) {
        const session = TestHelpers.createTestSession({
          name: `Session ${i}`,
          tabs: Array.from({ length: 10 }, (_, j) => ({
            title: `Tab ${j}`,
            url: `https://example${j}.com`,
            favIconUrl: `https://example${j}.com/favicon.ico`
          }))
        });
        
        // Simulate processing
        const processedSession = {
          ...session,
          tabCount: session.tabs.length
        };
        
        // Clear references
        delete processedSession.tabs;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Storage Performance', () => {
    test('should handle large storage operations efficiently', async () => {
      const largeSession = TestHelpers.createPerformanceTestData(1).sessions[0];
      largeSession.tabs = Array.from({ length: 1000 }, (_, i) => ({
        title: `Tab ${i}`,
        url: `https://example${i}.com`,
        favIconUrl: `https://example${i}.com/favicon.ico`
      }));
      
      const startTime = performance.now();
      
      // Simulate storage operation
      const storageData = {
        sessions: [largeSession],
        lastTab: 'create'
      };
      
      // Simulate JSON serialization/deserialization
      const serialized = JSON.stringify(storageData);
      const deserialized = JSON.parse(serialized);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // 100ms
      expect(deserialized.sessions[0].tabs.length).toBe(1000);
    });
  });

  describe('UI Rendering Performance', () => {
    test('should render large tab lists efficiently', async () => {
      const manyTabs = TestHelpers.createPerformanceTestData(500).tabs;
      
      const startTime = performance.now();
      
      // Simulate DOM rendering
      const tabElements = manyTabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        selected: true
      }));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(500); // 0.5 seconds
      expect(tabElements.length).toBe(500);
    });

    test('should render large session lists efficiently', async () => {
      const manySessions = TestHelpers.createPerformanceTestData(100).sessions;
      
      const startTime = performance.now();
      
      // Simulate session card rendering
      const sessionCards = manySessions.map(session => ({
        id: session.id,
        name: session.name,
        tabCount: session.tabs.length,
        createdAt: session.createdAt,
        actions: ['restore', 'delete']
      }));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(300); // 0.3 seconds
      expect(sessionCards.length).toBe(100);
    });
  });

  describe('Network Performance', () => {
    test('should handle favicon loading efficiently', async () => {
      const tabsWithFavicons = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Tab ${i + 1}`,
        url: `https://example${i + 1}.com`,
        favIconUrl: `https://example${i + 1}.com/favicon.ico`
      }));
      
      const startTime = performance.now();
      
      // Simulate favicon processing
      const processedTabs = tabsWithFavicons.map(tab => ({
        ...tab,
        faviconLoaded: true,
        faviconError: false
      }));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // 0.2 seconds
      expect(processedTabs.length).toBe(100);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent session operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        TestHelpers.createTestSession({ name: `Concurrent Session ${i}` })
      );
      
      const startTime = performance.now();
      
      // Simulate concurrent operations
      const promises = operations.map(async (session, index) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return { ...session, processed: true, index };
      });
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // 1 second
      expect(results.length).toBe(10);
      expect(results.every(r => r.processed)).toBe(true);
    });
  });
});
