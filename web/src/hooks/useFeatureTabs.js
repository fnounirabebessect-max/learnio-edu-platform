import { useState, useEffect } from 'react';

export const useFeatureTabs = () => {
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    // Add click handlers to tabs
    const tabs = document.querySelectorAll('.feature-tab');
    
    const handleTabClick = (e) => {
      const tab = e.currentTarget;
      const tabId = tab.getAttribute('data-tab');
      setActiveTab(tabId);
      
      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update content visibility
      const contentItems = document.querySelectorAll('.content-item');
      contentItems.forEach(item => {
        item.classList.remove('active');
        if (item.id === `${tabId}-content`) {
          item.classList.add('active');
        }
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });

    return () => {
      tabs.forEach(tab => {
        tab.removeEventListener('click', handleTabClick);
      });
    };
  }, []);

  return { activeTab };
};