import React, { useState, useEffect, useRef } from 'react';
import { BottomNav } from './components/BottomNav';
import { INITIAL_ITINERARY, TRIP_START_DATE } from './constants';
import { ItineraryCard } from './components/ItineraryCard';
import { WeatherWidget } from './components/WeatherWidget';
import { MapView } from './components/MapView';
import { Sparkles, MapPin, List, Navigation, Plus, Trash2, CheckCircle, Circle, X, Link, Briefcase, MapIcon, Edit, CloudRain } from './components/Icons';
import { askTravelAssistant, getAlternativePlans, analyzeItineraryInput } from './services/geminiService';
import { DaySchedule, ItineraryItem, ActivityType } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number}>({ days: 0, hours: 0 });
  
  // Make schedule mutable
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>(INITIAL_ITINERARY);

  // View Mode State
  const [isMapView, setIsMapView] = useState(false);

  // Drag and Drop State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Assistant State
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Backup State
  const [backupSuggestions, setBackupSuggestions] = useState<any[]>([]);
  const [loadingBackup, setLoadingBackup] = useState(false);

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemInput, setNewItemInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edit Item Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // Packing List State
  const [packingItems, setPackingItems] = useState([
    { id: '1', text: '護照', checked: false },
    { id: '2', text: '歐元現金', checked: false },
    { id: '3', text: '英鎊現金', checked: false },
    { id: '4', text: '轉換插頭 (英規)', checked: false },
    { id: '5', text: '行動電源', checked: false },
    { id: '6', text: '雨傘 / 雨衣', checked: false },
    { id: '7', text: '保暖圍巾', checked: false },
  ]);
  const [newItemText, setNewItemText] = useState('');

  // Scroll to top on tab change
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [currentTab, selectedDayIndex]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = TRIP_START_DATE.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft({ days, hours });
      } else {
        setTimeLeft({ days: 0, hours: 0 });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuery.trim()) return;
    setIsTyping(true);
    setAssistantResponse('');
    const answer = await askTravelAssistant(assistantQuery);
    setAssistantResponse(answer);
    setIsTyping(false);
  };

  const loadBackups = async () => {
    if (backupSuggestions.length > 0) return;
    setLoadingBackup(true);
    const res = await getAlternativePlans("倫敦市中心觀光");
    setBackupSuggestions(res.suggestions || []);
    setLoadingBackup(false);
  };

  const handleBackupButtonClick = async () => {
    setCurrentTab('backup');
    await loadBackups();
  };

  // Time Calculation Helpers
  const recalculateTimes = (items: ItineraryItem[], startTime?: string): ItineraryItem[] => {
    if (items.length === 0) return [];

    // Use provided startTime or default to the first item's current time
    let currentTimeStr = startTime || items[0].time;
    let [startH, startM] = currentTimeStr.split(':').map(Number);
    
    // Safety check
    if (isNaN(startH)) startH = 9;
    if (isNaN(startM)) startM = 0;
    
    let currentMinutes = startH * 60 + startM;

    return items.map((item) => {
      // Format current minutes back to HH:MM
      let h = Math.floor(currentMinutes / 60);
      let m = currentMinutes % 60;
      // Handle 24h wrap just in case
      if (h >= 24) h = h % 24;

      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      const updatedItem = { ...item, time: timeStr };

      // Add duration for next item
      // Default duration 60 mins if undefined
      const duration = item.duration || 60; 
      currentMinutes += duration; 
      
      return updatedItem;
    });
  };

  // Add Item Handler (AI Analysis)
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const dayLabel = scheduleData[selectedDayIndex].dayLabel;
      const result = await analyzeItineraryInput(newItemInput, dayLabel);
      
      const newItem: ItineraryItem = {
        id: Date.now().toString(),
        ...result
      };
      
      // Default duration if missing
      if (!newItem.duration) newItem.duration = 90;

      const updatedSchedule = [...scheduleData];
      // Capture start time of the day to preserve it
      const currentItems = updatedSchedule[selectedDayIndex].items;
      const startTime = currentItems.length > 0 ? currentItems[0].time : '09:00';

      updatedSchedule[selectedDayIndex].items.push(newItem);
      
      // Recalculate times
      const sortedItems = recalculateTimes(updatedSchedule[selectedDayIndex].items, startTime);
      updatedSchedule[selectedDayIndex].items = sortedItems;
      
      setScheduleData(updatedSchedule);
      setIsAddModalOpen(false);
      setNewItemInput('');
    } catch (error) {
      alert("分析失敗，請稍後再試或檢查連結");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Edit Item Handlers
  const handleEditClick = (item: ItineraryItem) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newSchedule = [...scheduleData];
    const currentItems = newSchedule[selectedDayIndex].items;
    const itemIndex = currentItems.findIndex(i => i.id === editingItem.id);

    if (itemIndex > -1) {
      // Keep coordinates if not manually changed (simple implementation: we just update text fields)
      currentItems[itemIndex] = {
        ...currentItems[itemIndex],
        ...editingItem
      };

      // Recalculate times just in case duration changed, starting from day start
      const dayStartTime = currentItems.length > 0 ? currentItems[0].time : '09:00';
      newSchedule[selectedDayIndex].items = recalculateTimes(currentItems, dayStartTime);
      
      setScheduleData(newSchedule);
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    setDraggingIndex(position);
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingIndex(null);
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const copyListItems = [...scheduleData[selectedDayIndex].items];
    // Capture the start time of the day *before* reordering
    const dayStartTime = copyListItems.length > 0 ? copyListItems[0].time : '09:00';

    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    // Recalculate times using the original day start time
    const updatedItems = recalculateTimes(copyListItems, dayStartTime);
    
    const newScheduleData = [...scheduleData];
    newScheduleData[selectedDayIndex].items = updatedItems;
    setScheduleData(newScheduleData);
  };

  const handleDeleteItineraryItem = (itemId: string) => {
    if (!window.confirm("確定要刪除這個行程嗎？")) return;
    
    const newSchedule = [...scheduleData];
    const currentItems = newSchedule[selectedDayIndex].items;
    
    // Capture start time. If we delete the first item, we usually still want the day to start at that time.
    const dayStartTime = currentItems.length > 0 ? currentItems[0].time : '09:00';

    newSchedule[selectedDayIndex].items = currentItems.filter(i => i.id !== itemId);
    
    // Recalculate
    newSchedule[selectedDayIndex].items = recalculateTimes(newSchedule[selectedDayIndex].items, dayStartTime);
    setScheduleData(newSchedule);
  };

  const handleUpdateDuration = (itemId: string, newDuration: number) => {
    const newSchedule = [...scheduleData];
    const currentItems = newSchedule[selectedDayIndex].items;
    const itemIndex = currentItems.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
      // Capture start time
      const dayStartTime = currentItems.length > 0 ? currentItems[0].time : '09:00';
      
      currentItems[itemIndex].duration = newDuration;
      
      // Recalculate
      newSchedule[selectedDayIndex].items = recalculateTimes(currentItems, dayStartTime);
      setScheduleData(newSchedule);
    }
  };

  // Packing List Handlers
  const togglePackingItem = (id: string) => {
    setPackingItems(items => items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      checked: false
    };
    setPackingItems([...packingItems, newItem]);
    setNewItemText('');
  };

  const deletePackingItem = (id: string) => {
    setPackingItems(items => items.filter(item => item.id !== id));
  };

  const currentDaySchedule = scheduleData[selectedDayIndex];

  // --- Views ---

  const renderHome = () => (
    <div className="p-6 space-y-8 pb-28 animate-fade-in">
      <header className="flex justify-between items-end mb-4 pt-4 border-b border-slate-200/50 pb-4">
         <div>
           <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-1">December 2025</p>
           <h1 className="font-display text-4xl font-bold text-[#00247D] tracking-tight">London <span className="text-slate-900 font-light italic">Trip</span></h1>
         </div>
         <div className="bg-[#CF142B] text-white font-bold px-3 py-1.5 rounded-full shadow-md text-[10px] tracking-widest uppercase mb-1">
           即將出發
         </div>
      </header>

      {/* Countdown Card - Royal Blue Theme */}
      <div className="bg-[#00247D] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Union Jack inspired abstract background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 bg-[#CF142B] rounded-full blur-[80px] opacity-40"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-56 h-56 bg-white rounded-full blur-[80px] opacity-10"></div>
        
        <div className="relative z-10 text-center">
           <h2 className="text-blue-200 text-xs font-bold uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-4 mx-12">距離出發</h2>
           <div className="flex items-baseline justify-center space-x-8">
             <div className="flex flex-col items-center">
                <span className="font-display text-6xl font-medium tracking-tighter drop-shadow-lg">{timeLeft.days}</span>
                <span className="text-[10px] font-bold text-blue-200 uppercase mt-2 tracking-widest">Days</span>
             </div>
             <span className="text-3xl font-light text-blue-400/50 -mt-4 italic">&</span>
             <div className="flex flex-col items-center">
                <span className="font-display text-6xl font-medium tracking-tighter drop-shadow-lg">{timeLeft.hours}</span>
                <span className="text-[10px] font-bold text-blue-200 uppercase mt-2 tracking-widest">Hours</span>
             </div>
           </div>
           <p className="mt-8 text-white/80 text-sm font-display italic tracking-wide">See you in London!</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setCurrentTab('schedule')} className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all group hover:border-[#00247D]/20">
          <div className="bg-blue-50/50 p-4 rounded-full text-[#00247D] group-hover:bg-[#00247D] group-hover:text-white transition-all duration-300">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-slate-800 text-base tracking-wide">每日行程</span>
        </button>
        <button onClick={() => setCurrentTab('packing')} className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all group hover:border-[#CF142B]/20">
          <div className="bg-red-50/50 p-4 rounded-full text-[#CF142B] group-hover:bg-[#CF142B] group-hover:text-white transition-all duration-300">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-slate-800 text-base tracking-wide">打包清單</span>
        </button>
      </div>

      {/* Highlight */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-900 text-xl tracking-tight">首站亮點</h3>
          <span className="text-[10px] font-bold text-[#00247D] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Day 1</span>
        </div>
        <div 
          className="w-full h-40 bg-slate-200 rounded-xl bg-cover bg-center relative shadow-inner mb-4 overflow-hidden group" 
          style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/The_Churchill_Arms%2C_Kensington%2C_London%2C_30_December_2021.jpg/640px-The_Churchill_Arms%2C_Kensington%2C_London%2C_30_December_2021.jpg")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
          <div className="absolute bottom-3 left-4 text-white">
            <span className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1 block">Dinner</span>
            <span className="font-display font-bold text-xl">The Churchill Arms</span>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-loose font-medium">
          以著名的鮮花外牆酒吧享用經典英式晚餐，開啟美好旅程。
        </p>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="pt-6 pb-28 relative min-h-full">
      <div className="px-6 mb-6 pt-2">
        <h2 className="font-display text-3xl font-bold text-[#00247D] tracking-tight">每日行程</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Itinerary & Activities</p>
      </div>

      {/* Date Selector */}
      <div className="flex overflow-x-auto space-x-3 pb-8 no-scrollbar px-6 snap-x">
        {scheduleData.map((day, index) => (
          <button
            key={day.date}
            onClick={() => setSelectedDayIndex(index)}
            className={`flex-shrink-0 snap-center px-4 py-4 rounded-2xl flex flex-col items-center min-w-[84px] transition-all duration-300 border ${
              selectedDayIndex === index
                ? 'bg-[#00247D] border-[#00247D] text-white shadow-xl shadow-blue-900/20 scale-105'
                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${selectedDayIndex === index ? 'text-blue-200' : ''}`}>{day.dayLabel}</span>
            <span className="font-display text-2xl font-bold my-1">{new Date(day.date).getDate()}</span>
            <span className="text-[10px] font-medium opacity-80">{new Date(day.date).toLocaleDateString('zh-TW', { weekday: 'short' })}</span>
          </button>
        ))}
      </div>

      <div className="px-6">
        <WeatherWidget date={currentDaySchedule.date} />

        {/* Backup Plan Button */}
        <button 
          onClick={handleBackupButtonClick}
          className="w-full mb-8 bg-white border border-[#00247D]/10 text-[#00247D] py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-sm flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-blue-50/50"
        >
          <Sparkles className="w-4 h-4" />
          <span>搜尋替代活動 (備案)</span>
        </button>
        
        <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-100">
          <div className="flex-1">
             <p className="text-[10px] text-[#CF142B] uppercase tracking-[0.2em] font-bold mb-1">Today's Theme</p>
            <h3 className="font-display text-2xl font-bold text-slate-900">{currentDaySchedule.title}</h3>
          </div>
          
          <div className="flex items-center space-x-3 mb-1">
             {/* Segmented Control for View Toggle */}
             <div className="bg-slate-100 p-1 rounded-lg flex items-center shadow-inner border border-slate-200">
               <button
                 onClick={() => setIsMapView(false)}
                 className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                   !isMapView ? 'bg-white text-[#00247D] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 <List className="w-3.5 h-3.5" />
                 <span>列表</span>
               </button>
               <button
                 onClick={() => setIsMapView(true)}
                 className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                   isMapView ? 'bg-white text-[#00247D] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 <MapIcon className="w-3.5 h-3.5" />
                 <span>地圖</span>
               </button>
             </div>

             <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#00247D] text-white p-2.5 rounded-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center hover:bg-[#001955]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-0 relative min-h-[300px]">
          {isMapView ? (
            <div className="animate-fade-in">
              <MapView items={currentDaySchedule.items} />
              <p className="text-center text-xs text-slate-400 mt-4 font-medium">點擊地標可開啟 Apple Maps 導航</p>
            </div>
          ) : (
            <>
              {currentDaySchedule.items.map((item, index) => (
                <ItineraryCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  onDelete={() => handleDeleteItineraryItem(item.id)}
                  onEdit={() => handleEditClick(item)}
                  onUpdateDuration={(newDuration) => handleUpdateDuration(item.id, newDuration)}
                  isDragging={draggingIndex === index} 
                />
              ))}
              {currentDaySchedule.items.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white mx-4">
                  <p className="font-display text-lg font-medium text-slate-600 mb-2">Empty Schedule</p>
                  <p className="text-xs">點擊「+」按鈕加入您的計畫</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderPackingList = () => (
    <div className="p-6 pb-28 h-full flex flex-col">
       <div className="mb-8 pt-2">
        <h2 className="font-display text-3xl font-bold text-[#00247D] tracking-tight">打包清單</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Checklist & Essentials</p>
      </div>

       {/* Add Item Form */}
       <form onSubmit={addPackingItem} className="flex gap-2 mb-8 sticky top-0 bg-slate-50 z-10 py-2">
          <input 
            type="text" 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="新增行李項目..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium shadow-sm"
          />
          <button type="submit" className="bg-[#00247D] text-white p-3 rounded-xl active:scale-95 transition-transform shadow-md">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-3 pb-safe">
          {packingItems.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center bg-white p-4 rounded-xl border-l-[6px] transition-all shadow-sm group ${
                item.checked 
                  ? 'border-slate-200 bg-slate-50' 
                  : 'border-[#CF142B]'
              }`}
            >
              <button 
                onClick={() => togglePackingItem(item.id)} 
                className={`mr-4 transition-colors ${item.checked ? 'text-slate-300' : 'text-[#00247D] hover:text-[#001955]'}`}
              >
                {item.checked ? <CheckCircle className="w-6 h-6 fill-current" /> : <Circle className="w-6 h-6" strokeWidth={2} />}
              </button>
              <span className={`flex-1 text-sm font-bold tracking-wide ${item.checked ? 'text-slate-400 line-through decoration-slate-300 decoration-2' : 'text-slate-700'}`}>
                {item.text}
              </span>
              <button 
                onClick={() => deletePackingItem(item.id)} 
                className="text-slate-300 hover:text-[#CF142B] p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {packingItems.length === 0 && (
             <div className="text-center py-12 text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>您的清單是空的</p>
             </div>
          )}
        </div>
    </div>
  );

  const renderBackup = () => (
    <div className="p-6 pb-28 h-full flex flex-col">
      <div className="mb-8 pt-2">
        <h2 className="font-display text-3xl font-bold text-[#00247D] tracking-tight">備選方案</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Alternatives & Indoor</p>
      </div>
      
      <p className="text-slate-600 text-sm mb-6 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm leading-relaxed">
        <span className="font-bold block mb-2 text-[#00247D] flex items-center"><CloudRain className="w-4 h-4 mr-2"/>下雨了嗎？</span>
        這些是 AI 推薦的倫敦室內好去處，不用擔心天氣影響行程。
      </p>

      {backupSuggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-5 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-[#CF142B]" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-800 mb-3">需要替代方案？</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-[240px] leading-relaxed">點擊下方按鈕，讓 AI 為您搜尋附近的最佳博物館、畫廊或室內市集。</p>
          <button 
            onClick={loadBackups}
            disabled={loadingBackup}
            className="bg-[#00247D] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-blue-900/10 active:scale-95 transition-all disabled:opacity-70 tracking-wide"
          >
            {loadingBackup ? '搜尋倫敦備案中...' : '尋找室內活動'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {backupSuggestions.map((plan, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold text-slate-900 text-xl group-hover:text-[#00247D] transition-colors">{plan.title}</h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold uppercase tracking-wide border border-emerald-100">室內</span>
              </div>
              <p className="text-slate-600 text-sm mt-2 leading-loose">{plan.description}</p>
              <div className="flex items-center text-slate-400 text-xs mt-4 font-bold uppercase tracking-wider border-t border-slate-50 pt-3">
                <MapPin className="w-3 h-3 mr-1.5 text-[#CF142B]" />
                {plan.location}
              </div>
            </div>
          ))}
          <button 
            onClick={() => setBackupSuggestions([])} 
            className="w-full py-4 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-[#CF142B] transition-colors"
          >
            清除結果並重新搜尋
          </button>
        </div>
      )}
    </div>
  );

  const renderAssistant = () => (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="p-6 bg-white border-b border-slate-100 pt-8">
        <h2 className="font-display text-3xl font-bold text-[#00247D] tracking-tight">旅遊助理</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">AI Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-start space-x-4">
          <div className="bg-[#00247D] p-2.5 rounded-2xl rounded-tl-none shadow-md mt-1">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="bg-white p-5 rounded-2xl rounded-tl-none text-slate-700 text-sm leading-loose shadow-sm border border-slate-100 max-w-[85%]">
            您好！我是您的倫敦旅遊助理。歡迎詢問任何關於 12 月行程、交通或穿搭的問題！🇬🇧
          </div>
        </div>

        {assistantResponse && (
          <div className="flex items-start space-x-4 animate-fade-in">
             <div className="bg-[#00247D] p-2.5 rounded-2xl rounded-tl-none shadow-md mt-1">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div className="bg-white p-5 rounded-2xl rounded-tl-none text-slate-800 text-sm leading-loose border border-blue-50 shadow-sm max-w-[85%]">
               {assistantResponse}
             </div>
          </div>
        )}
        
        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs ml-16">
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 pb-24">
        <form onSubmit={handleAssistantSubmit} className="relative">
          <input
            type="text"
            value={assistantQuery}
            onChange={(e) => setAssistantQuery(e.target.value)}
            placeholder="例如：地鐵 Oyster 卡怎麼買？"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#00247D]/10 focus:border-[#00247D] transition-all placeholder:text-slate-400 font-medium"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 p-2 bg-[#00247D] text-white rounded-xl hover:bg-[#001955] transition-colors shadow-sm"
          >
            <Navigation className="w-5 h-5 rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F5F5F7] min-h-screen font-sans text-slate-900 selection:bg-[#CF142B] selection:text-white">
      <main ref={mainRef} className="max-w-md mx-auto bg-[#F5F5F7] min-h-screen relative shadow-2xl overflow-y-auto no-scrollbar">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'schedule' && renderSchedule()}
        {currentTab === 'packing' && renderPackingList()}
        {currentTab === 'backup' && renderBackup()}
        {currentTab === 'assistant' && renderAssistant()}
        <BottomNav currentTab={currentTab} setTab={setCurrentTab} />
        
        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-[#00247D]/40 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl ring-1 ring-white/20">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-display text-2xl font-bold text-[#00247D]">新增行程項目</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-[#CF142B] transition-colors">
                   <X className="w-6 h-6" />
                 </button>
               </div>
               
               <p className="text-sm text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                 貼上 Google Maps 連結或活動描述，AI 將自動為您規劃交通方式與時間。
               </p>

               <form onSubmit={handleAddItemSubmit}>
                 <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-start mb-6 focus-within:border-[#00247D] transition-colors">
                   <Link className="w-5 h-5 text-slate-400 mt-1 mr-3 flex-shrink-0" />
                   <textarea
                     value={newItemInput}
                     onChange={(e) => setNewItemInput(e.target.value)}
                     placeholder="例如：https://goo.gl/maps/... 或「晚上去柯芬園逛逛」"
                     className="bg-transparent w-full text-sm text-slate-700 placeholder-slate-400 outline-none resize-none h-24 font-medium leading-relaxed"
                   />
                 </div>

                 <button 
                   type="submit" 
                   disabled={isAnalyzing || !newItemInput.trim()}
                   className="w-full bg-[#00247D] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center hover:bg-[#001955]"
                 >
                   {isAnalyzing ? (
                     <>
                       <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                       正在分析與規劃...
                     </>
                   ) : (
                     '加入行程'
                   )}
                 </button>
               </form>
             </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 bg-[#00247D]/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-fade-in">
             <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl ring-1 ring-white/20 h-[85vh] sm:h-auto overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-display text-2xl font-bold text-[#00247D] flex items-center tracking-tight">
                    <Edit className="w-5 h-5 mr-3" />
                    編輯行程
                 </h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-[#CF142B] transition-colors bg-slate-50 p-2 rounded-full">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleSaveEdit} className="space-y-5">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">活動名稱</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-bold text-slate-800"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">開始時間</label>
                        <input 
                          type="time" 
                          required
                          value={editingItem.time}
                          onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">停留 (分鐘)</label>
                        <input 
                          type="number" 
                          required
                          min="15"
                          step="15"
                          value={editingItem.duration || 60}
                          onChange={(e) => setEditingItem({...editingItem, duration: parseInt(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">地點名稱 (Google Maps)</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={editingItem.locationName}
                          onChange={(e) => setEditingItem({...editingItem, locationName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">類型</label>
                    <select
                       value={editingItem.type}
                       onChange={(e) => setEditingItem({...editingItem, type: e.target.value as ActivityType})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium appearance-none"
                    >
                        {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">描述與交通</label>
                    <textarea 
                      rows={3}
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium resize-none leading-relaxed"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">預算/門票 (選填)</label>
                        <input 
                          type="text" 
                          value={editingItem.price || ''}
                          onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                          placeholder="例如：£25"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">筆記 (選填)</label>
                        <input 
                          type="text" 
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                          placeholder="訂位編號..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00247D] transition-colors font-medium"
                        />
                     </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full bg-[#00247D] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all mt-6 hover:bg-[#001955]"
                 >
                   儲存變更
                 </button>
               </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
