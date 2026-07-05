import { create } from 'zustand';
import { CCCDData, DashboardStats, BatchProcessingState } from '@/types/cccd';

interface OCRStore {
  // State
  items: CCCDData[];
  stats: DashboardStats;
  batchState: BatchProcessingState;
  isDarkMode: boolean;
  
  // Actions
  addItems: (items: CCCDData[]) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CCCDData>) => void;
  updateField: (id: string, field: keyof CCCDData, value: string) => void;
  clearAll: () => void;
  
  // Batch processing
  setBatchState: (state: Partial<BatchProcessingState>) => void;
  resetBatchState: () => void;
  
  // Stats
  incrementExportCount: () => void;
  recalculateStats: () => void;
  
  // Theme
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const initialStats: DashboardStats = {
  totalProcessed: 0,
  successCount: 0,
  failureCount: 0,
  avgProcessingTime: 0,
  avgConfidence: 0,
  excelExportCount: 0,
};

const initialBatchState: BatchProcessingState = {
  total: 0,
  completed: 0,
  failed: 0,
  isProcessing: false,
  isCancelled: false,
  failedIds: [],
};

export const useOCRStore = create<OCRStore>((set, get) => ({
  items: [],
  stats: initialStats,
  batchState: initialBatchState,
  isDarkMode: false,

  addItems: (newItems) => set((state) => ({ 
    items: [...newItems, ...state.items] // Thêm lên đầu danh sách
  })),

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter((item) => item.id !== id);
    return { items: newItems };
  }),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  updateField: (id, field, value) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id 
        ? { ...item, [field]: value } 
        : item
    )
  })),

  clearAll: () => set({ items: [], stats: initialStats, batchState: initialBatchState }),

  setBatchState: (newState) => set((state) => ({
    batchState: { ...state.batchState, ...newState }
  })),

  resetBatchState: () => set({ batchState: initialBatchState }),

  incrementExportCount: () => set((state) => ({
    stats: { ...state.stats, excelExportCount: state.stats.excelExportCount + 1 }
  })),

  recalculateStats: () => set((state) => {
    const { items, stats } = state;
    
    // Chỉ tính những item đã xử lý xong (thành công hoặc lỗi)
    const processedItems = items.filter(item => item.status === 'success' || item.status === 'error');
    
    if (processedItems.length === 0) return { stats: { ...stats, totalProcessed: 0, successCount: 0, failureCount: 0, avgProcessingTime: 0, avgConfidence: 0 } };

    const successItems = processedItems.filter(item => item.status === 'success');
    
    // Tính thời gian trung bình
    const validTimeItems = processedItems.filter(item => item.processingTime && item.processingTime > 0);
    const totalTime = validTimeItems.reduce((sum, item) => sum + (item.processingTime || 0), 0);
    const avgProcessingTime = validTimeItems.length > 0 ? Math.round(totalTime / validTimeItems.length) : 0;

    // Tính độ chính xác trung bình (chỉ trên các item thành công)
    let avgConfidence = 0;
    if (successItems.length > 0) {
      const totalConf = successItems.reduce((sum, item) => {
        const confs = item.confidence;
        const itemAvgConf = (confs.fullName + confs.dateOfBirth + confs.address + confs.issueDate + confs.issuingAuthority) / 5;
        return sum + itemAvgConf;
      }, 0);
      avgConfidence = Math.round(totalConf / successItems.length);
    }

    return {
      stats: {
        ...stats,
        totalProcessed: processedItems.length,
        successCount: successItems.length,
        failureCount: processedItems.length - successItems.length,
        avgProcessingTime,
        avgConfidence,
      }
    };
  }),

  toggleDarkMode: () => set((state) => {
    const newIsDark = !state.isDarkMode;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    return { isDarkMode: newIsDark };
  }),

  setDarkMode: (isDark) => set(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    return { isDarkMode: isDark };
  }),
}));
