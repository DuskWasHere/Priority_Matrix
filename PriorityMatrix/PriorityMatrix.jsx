/**
 * Priority Matrix - Minimal Professional Design
 * Clean, Notion-inspired productivity system
 */

// Common constants for reusable values
const COMMON_CONSTANTS = {
  BADGE_STYLES: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  TRANSITIONS: {
    fast: 'all 0.15s ease',
    default: 'all 0.2s ease',
    colors: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  FONT_SIZES: {
    small: '11px',
    normal: '12px',
    medium: '13px',
    large: '14px',
    title: '16px',
    header: '24px'
  },
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },
  BORDER_RADIUS: {
    small: '4px',
    medium: '6px',
    large: '8px',
    pill: '12px',
    round: '50%'
  },
  SHADOWS: {
    small: '0 1px 3px rgba(0,0,0,0.12)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    large: '0 10px 20px rgba(0,0,0,0.15)',
    glow: (color) => `0 0 0 3px ${color}30`
  },
  ANIMATIONS: {
    fadeIn: 'fadeIn 0.2s ease-out',
    slideIn: 'slideIn 0.3s ease-out',
    pulse: 'pulse 1.5s ease-in-out infinite'
  },
  DATE_PATTERNS: [
    /(?:📅\s*|🗓️\s*)?(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/,  // YYYY-MM-DD
    /(?:📅\s*|🗓️\s*)?(\d{1,2}[\/]\d{1,2}[\/]\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/i,  // MM/DD/YYYY or DD/MM/YYYY
    /(?:📅\s*|🗓️\s*)?(\d{1,2}[-]\d{1,2}[-]\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/i  // MM-DD-YYYY or DD-MM-YYYY
  ],
  CACHE_LIMITS: {
    parseDate: 1000,
    taskDate: 500,
    fileLockTimeout: 300000 // 5 minutes
  },
  UI_DEFAULTS: {
    maxItemsPerSection: 10,
    notificationDuration: 3000,
    debounceDelay: 500,
    animationDuration: 150
  },
  ICONS: {
    note: '📄',
    task: '☐',
    taskCompleted: '☑',
    calendar: '📅',
    recurring: '🔄',
    urgent: '🔥',
    search: '🔍',
    settings: '⚙️',
    stats: '📊',
    inbox: '📥',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    sparkles: '✨',
    target: '🎯',
    clock: '⏰',
    flag: '🚩'
  }
};

// Static styles - these don't change during component lifecycle
const STATIC_STYLES = {
  baseFont: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  transitions: COMMON_CONSTANTS.TRANSITIONS,
  layout: {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: COMMON_CONSTANTS.SPACING.xl,
      flexWrap: 'wrap',
      gap: COMMON_CONSTANTS.SPACING.lg
    },
    headerCentered: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      width: '100%'
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: COMMON_CONSTANTS.SPACING.sm,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      flexShrink: 1,
      minWidth: 'min-content'
    }
  },
  typography: {
    title: {
      fontSize: '24px',
      fontWeight: '600',
      margin: 0,
      letterSpacing: '-0.02em',
      flexShrink: 0,
      minWidth: 'fit-content'
    }
  },
  grid: {
    matrixGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '32px'
    }
  },
  badges: {
    base: COMMON_CONSTANTS.BADGE_STYLES
  },
  responsive: {
    '@media (max-width: 768px)': {
      matrixGrid: {
        gridTemplateColumns: '1fr'
      }
    }
  }
};

// Enhanced Item Component with better visual feedback
function OptimizedItem({ item, type, sectionColor, isDraggable = true, theme, config, onItemClick, onDragStart, onDragEnd, interactionState, handleTaskToggle }) {
  const { useState } = dc;
  const [isHovered, setIsHovered] = useState(false);
  const isNote = type === "note";
  let title = isNote ? item.$name : item.$text;
  const dateProperty = config.scheduling.datePropertyName;
  const recurringProperty = config.scheduling.recurringPropertyName;
  
  // Extract date and recurring info
  let date = "";
  let recurring = "";
  let isDateOverdue = false;
  
  if (isNote && item.$frontmatter) {
    const frontmatterDate = item.$frontmatter[dateProperty];
    if (frontmatterDate) {
      date = extractFrontmatterValue(frontmatterDate);
    }
    
    const frontmatterRecurring = item.$frontmatter[recurringProperty];
    if (frontmatterRecurring) {
      if (Array.isArray(frontmatterRecurring)) {
        recurring = frontmatterRecurring.join(", ");
      } else {
        recurring = extractFrontmatterValue(frontmatterRecurring);
      }
    }
    
    isDateOverdue = date && cachedParseDate(date) < cachedParseDate(new Date().toISOString().split('T')[0]);
  } else if (!isNote && item.$text) {
    // Simplified task date extraction for performance
    const dateMatch = item.$text.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      date = dateMatch[1];
      isDateOverdue = cachedParseDate(date) < cachedParseDate(new Date().toISOString().split('T')[0]);
      title = item.$text.replace(/(?:📅\s*|🗓️\s*)?(\d{4}-\d{2}-\d{2})/g, '').trim();
    }
  }
  
  return (
    <div
      className="priority-matrix-item"
      data-dragging={isDraggable && interactionState.draggedItem?.item === item ? "true" : "false"}
      style={{
        background: isHovered ? theme.surfaceHover : theme.cardBg,
        border: `1px solid ${isHovered ? theme.borderHover : theme.border}`,
        borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
        padding: COMMON_CONSTANTS.SPACING.md,
        cursor: isDraggable ? (isHovered ? 'grab' : 'pointer') : 'pointer',
        transition: COMMON_CONSTANTS.TRANSITIONS.smooth,
        borderLeft: `3px solid ${isDateOverdue ? theme.error : sectionColor}`,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? COMMON_CONSTANTS.SHADOWS.medium : COMMON_CONSTANTS.SHADOWS.small,
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={() => onItemClick(item, type)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item, type);
        }
      }}
      draggable={isDraggable}
      onDragStart={(e) => {
        e.currentTarget.style.cursor = 'grabbing';
        onDragStart(e, item, type);
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.cursor = isDraggable ? 'grab' : 'pointer';
        if (onDragEnd) onDragEnd(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`${isNote ? 'Note' : 'Task'}: ${title}${isDateOverdue ? ' (Overdue)' : ''}${date ? `, Due: ${date}` : ''}`}
    >
      {/* Urgent indicator for overdue items */}
      {isDateOverdue && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${theme.error}, transparent)`,
          opacity: 0.8
        }} />
      )}
      
      <div>
        <div style={{ 
          fontWeight: '500', 
          color: theme.text,
          marginBottom: date || recurring || (!isNote && item.$file) ? COMMON_CONSTANTS.SPACING.xs : '0',
          display: 'flex',
          alignItems: 'center',
          gap: COMMON_CONSTANTS.SPACING.xs
        }}>
          {isNote ? (
            <>
              <span style={{ fontSize: '16px', opacity: 0.8 }}>
                {COMMON_CONSTANTS.ICONS.note}
              </span>
              <span style={{ flex: 1 }}>{title}</span>
            </>
          ) : (
            <>
              <input 
                type="checkbox" 
                checked={item.$completed || false}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTaskToggle(item, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ marginRight: COMMON_CONSTANTS.SPACING.xs, cursor: 'pointer' }}
              />
              <span style={{ flex: 1, textDecoration: item.$completed ? 'line-through' : 'none', opacity: item.$completed ? 0.6 : 1 }}>
                {title}
              </span>
            </>
          )}
        </div>
        {/* Show source file for tasks */}
        {!isNote && item.$file && (
          <div style={{
            fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
            color: theme.textMuted,
            marginTop: '2px',
            marginLeft: '20px',
            fontStyle: 'italic'
          }}>
            from: {item.$file.split('/').pop().replace('.md', '')}
          </div>
        )}
      </div>
      {(date || recurring) && (
        <div style={{ 
          fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, 
          color: theme.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: COMMON_CONSTANTS.SPACING.sm,
          flexWrap: 'wrap'
        }}>
          {date && (
            <span style={{ 
              color: isDateOverdue ? theme.error : theme.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {COMMON_CONSTANTS.ICONS.calendar} {date}
            </span>
          )}
          {recurring && (
            <span style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {COMMON_CONSTANTS.ICONS.recurring} {recurring}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hoverable Note Item Component - fixes useState in render
function HoverableNoteItem({ note, section, theme, config, styles, formatDate, isOverdue }) {
  const { useState, useCallback } = dc;
  const [noteHovered, setNoteHovered] = useState(false);
  const isNoteOverdue = isOverdue(extractFrontmatterValue(note.$frontmatter?.[config.scheduling.datePropertyName]));
  
  const handleNoteClick = useCallback(() => {
    if (note.$path) {
      app.workspace.openLinkText(note.$path, "");
    }
  }, [note.$path]);
  
  // Memoize section badge text
  const sectionBadgeText = (section.title || '').replace(/[^\w\s]/gi, '').split(' ')[0];
  
  return (
    <div
      style={{
        ...styles.itemCard,
        borderLeft: isNoteOverdue ? `4px solid ${theme.error}` : `4px solid ${section.color}`,
        position: 'relative',
        background: noteHovered ? theme.surfaceHover : styles.itemCard.background,
        transform: noteHovered ? 'translateY(-1px)' : 'none',
        boxShadow: noteHovered ? `0 4px 12px ${theme.shadowHover}` : 'none',
        transition: COMMON_CONSTANTS.TRANSITIONS.fast
      }}
      onMouseEnter={() => setNoteHovered(true)}
      onMouseLeave={() => setNoteHovered(false)}
    >
      {/* Enhanced Section indicator */}
      <div style={{
        ...COMMON_CONSTANTS.BADGE_STYLES,
        position: 'absolute',
        top: '6px',
        right: '6px',
        background: section.color,
        color: 'white',
        boxShadow: `0 2px 4px ${section.color}40`,
        border: `1px solid ${section.color}`,
        opacity: noteHovered ? 1 : 0.8
      }}>
        {sectionBadgeText}
      </div>
    
      <div style={styles.itemTitle}>
        <div 
          onClick={handleNoteClick} 
          style={{ cursor: 'pointer' }}
        >
          📄 {note.$name}
        </div>
      </div>
      
      <div style={styles.itemMeta}>
        {note.$frontmatter?.[config.scheduling.datePropertyName] && (
          <span style={{ color: isOverdue(extractFrontmatterValue(note.$frontmatter[config.scheduling.datePropertyName])) ? theme.error : theme.textSecondary }}>
            📅 {formatDate(extractFrontmatterValue(note.$frontmatter[config.scheduling.datePropertyName]))}
          </span>
        )}
        {note.$frontmatter?.[config.scheduling.recurringPropertyName] && (
          <span>🔄 {extractFrontmatterValue(note.$frontmatter[config.scheduling.recurringPropertyName])}</span>
        )}
        <span style={{ marginLeft: 'auto' }}>Note</span>
      </div>
    </div>
  );
}

// Hoverable Task Item Component - fixes useState in render
function HoverableTaskItem({ task, section, theme, config, styles, formatDate, isOverdue, extractTaskDate, handleTaskToggle }) {
  const { useState, useMemo, useCallback } = dc;
  const [taskHovered, setTaskHovered] = useState(false);
  const isTaskOverdue = isOverdue(extractTaskDate(task.$text));
  
  // Memoize the cleaned task text to avoid regex on every render
  const cleanedTaskText = useMemo(() => {
    return task.$text
      .replace(/(?:📅\s*|🗓️\s*)?(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/g, '')
      .replace(/(?:📅\s*|🗓️\s*)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/gi, '')
      .trim();
  }, [task.$text]);
  
  const handleTaskClick = useCallback(() => {
    if (task.$file) {
      app.workspace.openLinkText(task.$file, "");
    }
  }, [task.$file]);
  
  // Memoize section badge text
  const sectionBadgeText = useMemo(() => {
    return (section.title || '').replace(/[^\w\s]/gi, '').split(' ')[0];
  }, [section.title]);
  
  // Memoize file name
  const fileName = useMemo(() => {
    return task.$file ? task.$file.split('/').pop().replace('.md', '') : '';
  }, [task.$file]);
  
  return (
    <div
      style={{
        ...styles.itemCard,
        borderLeft: isTaskOverdue ? `4px solid ${theme.error}` : `4px solid ${section.color}`,
        position: 'relative',
        background: taskHovered ? theme.surfaceHover : styles.itemCard.background,
        transform: taskHovered ? 'translateY(-1px)' : 'none',
        boxShadow: taskHovered ? `0 4px 12px ${theme.shadowHover}` : 'none',
        transition: COMMON_CONSTANTS.TRANSITIONS.fast
      }}
      onMouseEnter={() => setTaskHovered(true)}
      onMouseLeave={() => setTaskHovered(false)}
    >
      {/* Enhanced Section indicator */}
      <div style={{
        ...COMMON_CONSTANTS.BADGE_STYLES,
        position: 'absolute',
        top: '6px',
        right: '6px',
        background: section.color,
        color: 'white',
        boxShadow: `0 2px 4px ${section.color}40`,
        border: `1px solid ${section.color}`,
        opacity: taskHovered ? 1 : 0.8
      }}>
        {sectionBadgeText}
      </div>
    
      <div style={styles.itemTitle}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <input 
              type="checkbox" 
              checked={task.$completed || false}
              onChange={(e) => {
                e.stopPropagation();
                handleTaskToggle(task, e.target.checked);
              }}
              style={{ marginTop: '2px', cursor: 'pointer' }}
            />
            <span 
              onClick={handleTaskClick} 
              style={{ flex: 1, cursor: 'pointer' }}
            >
              {cleanedTaskText}
            </span>
          </div>
          {/* Show source note for tasks */}
          {task.$file && (
            <div style={{
              fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
              color: theme.textMuted,
              marginTop: '2px',
              marginLeft: '24px',
              fontStyle: 'italic'
            }}>
              from: {fileName}
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.itemMeta}>
        {extractTaskDate(task.$text) && (
          <span style={{ color: isOverdue(extractTaskDate(task.$text)) ? theme.error : theme.textSecondary }}>
            📅 {formatDate(extractTaskDate(task.$text))}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>Task</span>
      </div>
    </div>
  );
}

// Utility: Extract actual value from Obsidian frontmatter
function extractFrontmatterValue(value) {
  if (!value) return value;
  if (typeof value === 'object') {
    return value.value || value.raw || value;
  }
  return value;
}

// Utility: Extract tag value
function extractTagValue(tag) {
  if (!tag) return '';
  let actualTag = tag;
  if (tag && typeof tag === 'object') {
    actualTag = tag.value || tag.raw || tag.tag || tag;
  }
  if (typeof actualTag !== 'string') return '';
  return actualTag.startsWith('#') ? actualTag.slice(1) : actualTag;
}

// Utility: Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility: Cached date parser with multiple format support
const parseDateCache = new Map();
function cachedParseDate(dateInput) {
  if (!dateInput) return null;
  const cacheKey = String(dateInput);
  if (parseDateCache.has(cacheKey)) {
    return parseDateCache.get(cacheKey);
  }
  
  try {
    const cleanInput = cacheKey.trim();
    let date = null;
    
    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanInput)) {
      date = new Date(cleanInput);
    }
    // Try MM/DD/YYYY or MM-DD-YYYY format
    else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(cleanInput)) {
      const parts = cleanInput.split(/[\/\-]/);
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Check if it might be DD/MM/YYYY format (day > 12)
        if (month > 12 && day <= 12) {
          date = new Date(year, day - 1, month);
        } else {
          date = new Date(year, month - 1, day);
        }
      }
    }
    // Fallback to default Date parsing
    else {
      date = new Date(cleanInput);
    }
    
    const result = date && !isNaN(date.getTime()) ? date : null;
    parseDateCache.set(cacheKey, result);
    
    // Limit cache size
    if (parseDateCache.size > COMMON_CONSTANTS.CACHE_LIMITS.parseDate) {
      const firstKey = parseDateCache.keys().next().value;
      parseDateCache.delete(firstKey);
    }
    return result;
  } catch {
    parseDateCache.set(cacheKey, null);
    return null;
  }
}

function PriorityMatrix() {
  const { useState, useEffect, useRef, useMemo, useCallback } = dc;
  
  // Auto-detect theme from Obsidian
  const getObsidianTheme = () => {
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    }
    return 'light';
  };

  /**************************************************************
   * State Management - Simplified & Clean
   **************************************************************/
  const [config, setConfig] = useState({
    sections: {
      doFirst: {
        title: "🔥 Do First",
        subtitle: "Urgent & Important",
        description: "Crisis situations, urgent problems, deadline-driven projects",
        color: "#ff4757",
        position: { row: 0, col: 0 },
        propertyRules: { enabled: true, propertyName: "eisenhower_status", propertyValue: "urgent_important" },
        taskRules: { enabled: true, tagName: "urgent-important" }
      },
      schedule: {
        title: "📅 Schedule", 
        subtitle: "Not Urgent & Important",
        description: "Strategic planning, personal development, prevention activities",
        color: "#ffa502",
        position: { row: 0, col: 1 },
        propertyRules: { enabled: true, propertyName: "eisenhower_status", propertyValue: "not_urgent_important" },
        taskRules: { enabled: true, tagName: "schedule" }
      },
      delegate: {
        title: "👥 Delegate",
        subtitle: "Urgent & Not Important",
        description: "Interruptions, some emails, some phone calls, some meetings",
        color: "#2ed573",
        position: { row: 1, col: 0 },
        propertyRules: { enabled: true, propertyName: "eisenhower_status", propertyValue: "urgent_not_important" },
        taskRules: { enabled: true, tagName: "delegate" }
      },
      eliminate: {
        title: "🗑️ Don't Do",
        subtitle: "Not Urgent & Not Important",
        description: "Time wasters, trivia, busy work, some emails, some phone calls",
        color: "#747d8c",
        position: { row: 1, col: 1 },
        propertyRules: { enabled: true, propertyName: "eisenhower_status", propertyValue: "not_urgent_not_important" },
        taskRules: { enabled: true, tagName: "eliminate" }
      }
    },
    display: {
      showTasks: true,
      showNotes: true,
      showCompleted: true,
      viewMode: "matrix", // matrix, list, merged
      sortBy: "priority", // priority, date, name, created, modified
      filterBy: "all", // all, overdue, today, week, completed, pending
      maxItemsPerSection: COMMON_CONSTANTS.UI_DEFAULTS.maxItemsPerSection,
      compactMode: false,
      showDescriptions: false,
      enableAnimations: true,
      showMetrics: true
    },
    scheduling: {
      datePropertyName: "due_date",
      recurringPropertyName: "recurring",
      enableScheduling: true,
      enableRecurring: true
    },
    excludedFolders: ["templates", "archive", ".obsidian"],
    ui: {
      showSettings: false,
      showSearch: false,
      showStats: false,
      activeTab: "sections",
      containerMaxWidth: 1200,
      title: "Priority Matrix",
      searchQuery: "",
      selectedFilter: "all",
      sortBy: "priority",
      showNotifications: true,
      notificationPosition: "top-right"
    }
  });

  // Consolidated state for better performance
  const [appState, setAppState] = useState({
    isLoading: false,
    stats: {
      summary: {
        totalItems: 0,
        totalNotes: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        todayTasks: 0,
        weekTasks: 0,
        unscheduledItems: 0,
        recurringItems: 0,
        completionRate: 0,
        productivityScore: 0,
        completedThisWeek: 0,
        avgDailyCompletions: '0',
        workloadBalance: 0,
        tasksByDate: [],
        quadrantBalance: {},
        completedLastMonth: 0,
        momentum: 0,
        urgencyIndex: 0,
        focusScore: '0',
        daysToComplete: 0,
        activityHeatMap: [],
        weeklyPattern: [0, 0, 0, 0, 0, 0, 0],
        quadrantEfficiency: {},
        velocityTrend: '0'
      }
    },
    errors: [],
    notifications: []
  });
  
  const [uiState, setUiState] = useState({
    activeSettingsTab: "sections",
    showUnassignedCockpit: false,
    isHeaderWrapped: false,
    newExcludedFolder: "",
    newQuadrantName: ""
  });
  
  const [interactionState, setInteractionState] = useState({
    draggedItem: null,
    dragOverSection: null,
    selectedItems: new Set(),
    bulkMoveTarget: ""
  });
  
  const [filterState, setFilterState] = useState({
    cockpitSearchQuery: "",
    cockpitPathFilter: "",
    cockpitItemTypeFilter: "all" // all, notes, tasks
  });
  
  const saveTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationTimeoutRef = useRef(new Map());
  const headerRef = useRef(null);
  
  // File locking mechanism to prevent concurrent modifications
  const fileLocksRef = useRef(new Map());
  const fileUpdateQueueRef = useRef(new Map());

  /**************************************************************
   * Error Logging
   **************************************************************/
  const logError = (message, error, context = {}) => {
    console.error(`[PriorityMatrix] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      context
    });
  };

  // Notification system matching FinanceManager's implementation
  const addNotification = useCallback((message, type = "info", duration = COMMON_CONSTANTS.UI_DEFAULTS.notificationDuration) => {
    if (typeof app !== 'undefined' && app.notice) {
      // Use Obsidian's native notification system
      return new app.notice(message, duration);
    } else {
      // Fallback to custom notifications with FinanceManager styling
      const id = Date.now() + Math.random();
      const notification = { id, message, type, timestamp: Date.now() };
      
      setAppState(prev => ({ ...prev, notifications: [...prev.notifications, notification] }));
      
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          setAppState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
          notificationTimeoutRef.current.delete(id);
        }, duration);
        notificationTimeoutRef.current.set(id, timeoutId);
      }
      
      return id;
    }
  }, []);
  
  const removeNotification = useCallback((id) => {
    setAppState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
    const timeoutId = notificationTimeoutRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationTimeoutRef.current.delete(id);
    }
  }, []);
  
  // Optimized event handlers to prevent unnecessary re-renders
  const handleClearSelection = useCallback(() => {
    setInteractionState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);
  
  const handleCloseSettings = useCallback(() => {
    updateConfig('ui.showSettings', false);
  }, []);
  
  const handleCloseStats = useCallback(() => {
    updateConfig('ui.showStats', false);
  }, []);
  
  const handleCloseSearch = useCallback(() => {
    updateConfig('ui.showSearch', false);
  }, []);
  
  const handleToggleCockpit = useCallback(() => {
    setUiState(prev => ({ ...prev, showUnassignedCockpit: !prev.showUnassignedCockpit }));
  }, []);
  
  const handleOpenStats = useCallback(() => {
    updateConfig('ui.showStats', true);
  }, []);
  
  const handleOpenSearch = useCallback(() => {
    updateConfig('ui.showSearch', true);
  }, []);
  
  const handleOpenSettings = useCallback(() => {
    updateConfig('ui.showSettings', true);
  }, []);
  
  const handleError = (error, context = {}) => {
    const errorId = Date.now();
    const errorObj = {
      id: errorId,
      message: error?.message || String(error),
      context,
      timestamp: Date.now()
    };
    
    setAppState(prev => ({ ...prev, errors: [...prev.errors.slice(-9), errorObj] })); // Keep last 10 errors
    logError(errorObj.message, error, context);
    addNotification(`Error: ${errorObj.message}`, "error", COMMON_CONSTANTS.UI_DEFAULTS.notificationDuration * 2);
  };

  /**************************************************************
   * Data Loading & Persistence
   **************************************************************/
  useEffect(() => {
    loadConfig();
    
    // Inject styles to ensure full width in Obsidian
    const styleId = 'priority-matrix-full-width';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        /* Force full width for Priority Matrix - works without cssclasses */
        .workspace-leaf-content:has(.datacore-react-root) .markdown-preview-view,
        .workspace-leaf-content:has(.datacore-react-root) .markdown-source-view.mod-cm6 .cm-editor,
        .workspace-leaf-content:has(.datacore-react-root) .view-content {
          max-width: 100% !important;
          width: 100% !important;
        }
        
        /* Override all note width constraints for this component */
        .workspace-leaf-content:has(.datacore-react-root) .markdown-preview-sizer,
        .workspace-leaf-content:has(.datacore-react-root) .cm-content,
        .workspace-leaf-content:has(.datacore-react-root) .cm-sizer,
        .workspace-leaf-content:has(.datacore-react-root) .markdown-preview-section {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 auto !important;
        }
        
        /* Remove padding from containers */
        .workspace-leaf-content:has(.datacore-react-root) .markdown-preview-view {
          padding: 0 !important;
        }
        
        /* Ensure datacore root itself is full width */
        .datacore-react-root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Override any theme-specific constraints */
        .workspace-leaf-content:has(.datacore-react-root) .markdown-reading-view,
        .workspace-leaf-content:has(.datacore-react-root) .markdown-preview-pusher {
          max-width: 100% !important;
          width: 100% !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Setup ESC key listener
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        updateConfig('ui.showSettings', false);
        updateConfig('ui.showSearch', false);
        updateConfig('ui.showStats', false);
        // Clear search when closing
        updateConfig('ui.searchQuery', '');
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Setup resize observer for header wrapping detection
    const checkHeaderWrap = () => {
      if (headerRef.current) {
        const header = headerRef.current;
        const title = header.querySelector('h1');
        const toolbar = header.querySelector('[data-toolbar]');
        
        if (title && toolbar) {
          const titleRect = title.getBoundingClientRect();
          const toolbarRect = toolbar.getBoundingClientRect();
          
          // Check if toolbar is on a different line than title
          // We check if the top of toolbar is significantly below the top of title
          const isWrapped = toolbarRect.top > (titleRect.top + titleRect.height / 2);
          setUiState(prev => ({ ...prev, isHeaderWrapped: isWrapped }));
        }
      }
    };
    
    // Check on mount and window resize
    setTimeout(checkHeaderWrap, 100);
    window.addEventListener('resize', checkHeaderWrap);
    
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      resizeObserver = new ResizeObserver(checkHeaderWrap);
      resizeObserver.observe(headerRef.current);
    }
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', checkHeaderWrap);
      if (resizeObserver) resizeObserver.disconnect();
      // Remove injected styles on unmount
      const styleEl = document.getElementById('priority-matrix-full-width');
      if (styleEl) styleEl.remove();
    };
  }, []);

  // Debounced config save - only for specific properties that need persistence
  const configSaveProps = useMemo(() => ({
    sections: config.sections,
    display: config.display,
    scheduling: config.scheduling,
    excludedFolders: config.excludedFolders
  }), [config.sections, config.display, config.scheduling, config.excludedFolders]);
  
  useEffect(() => {
    if (Object.keys(configSaveProps.sections).length > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveConfig(), COMMON_CONSTANTS.UI_DEFAULTS.debounceDelay);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [configSaveProps]);

  async function loadConfig() {
    try {
      setAppState(prev => ({ ...prev, isLoading: true }));
      const configFile = app.vault.getAbstractFileByPath("PriorityMatrix/priority_matrix_data.json");
      if (!configFile) return;
      
      const content = await app.vault.read(configFile);
      const parsed = JSON.parse(content);
      if (parsed.userConfig) {
        setConfig(prev => ({
          ...prev,
          sections: parsed.userConfig.sections || prev.sections,
          display: { ...prev.display, ...parsed.userConfig.display },
          scheduling: { ...prev.scheduling, ...parsed.userConfig.scheduling },
          excludedFolders: parsed.userConfig.excludedFolders || prev.excludedFolders,
          ui: { ...prev.ui, ...parsed.userConfig.ui, showSettings: false, showSearch: false, showStats: false, searchQuery: '' }
        }));
      }
    } catch (err) {
      logError("Failed to load config:", err);
    } finally {
      setAppState(prev => ({ ...prev, isLoading: false }));
    }
  }

  async function saveConfig() {
    try {
      const configFile = app.vault.getAbstractFileByPath("PriorityMatrix/priority_matrix_data.json");
      let fileObj = {};
      if (configFile) {
        const current = await app.vault.read(configFile);
        try {
          fileObj = JSON.parse(current);
        } catch {
          fileObj = {};
        }
      }
      
      fileObj.userConfig = {
        ...fileObj.userConfig,
        sections: config.sections,
        display: config.display,
        scheduling: config.scheduling,
        excludedFolders: config.excludedFolders,
        ui: { ...config.ui, showSettings: false, showSearch: false, showStats: false, searchQuery: '' }
      };
      
      const finalJson = JSON.stringify(fileObj, null, 2);
      if (configFile) {
        await app.vault.modify(configFile, finalJson);
      } else {
        await app.vault.create("PriorityMatrix/priority_matrix_data.json", finalJson);
      }
    } catch (error) {
      logError("Failed to save config:", error);
    }
  }

  /**************************************************************
   * Data Queries
   **************************************************************/
  const notesQuery = useMemo(() => {
    let base = "@page";
    if (config.excludedFolders?.length) {
      const excluded = config.excludedFolders.map(folder => `!path("${folder}")`).join(" and ");
      base += ` and (${excluded})`;
    }
    return base;
  }, [config.excludedFolders]);

  const tasksQuery = useMemo(() => {
    let base = "@task";
    if (config.excludedFolders?.length) {
      const excluded = config.excludedFolders.map(folder => `!path("${folder}")`).join(" and ");
      base += ` and (${excluded})`;
    }
    return base;
  }, [config.excludedFolders]);

  const notes = dc.useQuery(notesQuery);
  const tasks = dc.useQuery(tasksQuery);

  // Get unassigned items
  const unassignedItems = useMemo(() => {
    const result = {
      notes: [],
      tasks: []
    };

    if (!notes || !tasks) return result;

    // Find notes without eisenhower_status
    if (config.display.showNotes && Array.isArray(notes)) {
      result.notes = notes.filter(note => {
        if (!note || !note.$frontmatter) return false;
        
        // Apply path filter
        if (filterState.cockpitPathFilter && note.$path) {
          const pathFilter = filterState.cockpitPathFilter.toLowerCase().trim();
          const notePath = note.$path.toLowerCase();
          if (!notePath.includes(pathFilter)) return false;
        }
        
        // Check if note has any eisenhower_status
        const hasStatus = Object.values(config.sections).some(section => {
          if (!section.propertyRules?.enabled) return false;
          const propValue = note.$frontmatter[section.propertyRules.propertyName];
          const actualValue = extractFrontmatterValue(propValue);
          return actualValue === section.propertyRules.propertyValue;
        });
        
        return !hasStatus;
      });
    }

    // Find tasks without eisenhower tags
    if (config.display.showTasks && Array.isArray(tasks)) {
      result.tasks = tasks.filter(task => {
        if (!task || !task.$tags) return false;
        if (!config.display.showCompleted && task.$completed) return false;
        
        // Apply path filter
        if (filterState.cockpitPathFilter && task.$file) {
          const pathFilter = filterState.cockpitPathFilter.toLowerCase().trim();
          const taskPath = task.$file.toLowerCase();
          if (!taskPath.includes(pathFilter)) return false;
        }
        
        // Check if task has any eisenhower tag
        const hasTag = Object.values(config.sections).some(section => {
          if (!section.taskRules?.enabled) return false;
          return task.$tags.some(tag => {
            const cleanTag = extractTagValue(tag);
            return cleanTag === section.taskRules.tagName;
          });
        });
        
        return !hasTag;
      });
    }

    // Apply cockpit search filter (separate from main search)
    if (filterState.cockpitSearchQuery) {
      const query = filterState.cockpitSearchQuery.toLowerCase();
      result.notes = result.notes.filter(note => 
        note.$name?.toLowerCase().includes(query)
      );
      result.tasks = result.tasks.filter(task => 
        task.$text?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notes, tasks, config.sections, config.display.showNotes, config.display.showTasks, config.display.showCompleted, filterState.cockpitSearchQuery, filterState.cockpitPathFilter]);

  /**************************************************************
   * Data Processing - Optimized with Date Caching
   **************************************************************/
  // Cache for expensive date operations
  const dateCache = useRef(new WeakMap());
  const taskDateCache = useRef(new Map());
  
  // Cached date extraction function
  const getCachedTaskDate = useCallback((taskText) => {
    if (!taskText) return null;
    if (taskDateCache.current.has(taskText)) {
      return taskDateCache.current.get(taskText);
    }
    
    const datePatterns = COMMON_CONSTANTS.DATE_PATTERNS;
    
    let result = null;
    for (const pattern of datePatterns) {
      const match = taskText.match(pattern);
      if (match) {
        result = match[1];
        break;
      }
    }
    
    taskDateCache.current.set(taskText, result);
    return result;
  }, []);
  
  // Clear date cache when tasks change
  useEffect(() => {
    taskDateCache.current.clear();
  }, [tasks]);
  
  // Cleanup mechanism for caches and locks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Clean up date cache if it gets too large
      if (taskDateCache.current.size > COMMON_CONSTANTS.CACHE_LIMITS.taskDate) {
        taskDateCache.current.clear();
      }
      
      // Clean up global parse date cache
      if (parseDateCache.size > COMMON_CONSTANTS.CACHE_LIMITS.parseDate) {
        // Keep most recent half of entries
        const entries = Array.from(parseDateCache.entries());
        const toKeep = entries.slice(-COMMON_CONSTANTS.CACHE_LIMITS.taskDate);
        parseDateCache.clear();
        toKeep.forEach(([key, value]) => parseDateCache.set(key, value));
      }
      
      // Clean up any stale file locks (older than 5 minutes)
      const now = Date.now();
      fileLocksRef.current.forEach((lockTime, filePath) => {
        if (typeof lockTime === 'number' && now - lockTime > COMMON_CONSTANTS.CACHE_LIMITS.fileLockTimeout) {
          fileLocksRef.current.delete(filePath);
        }
      });
    }, 60000); // Run every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  /**************************************************************
   * Utility Functions - Optimized with caching
   **************************************************************/
  const parseDate = useCallback((dateInput) => cachedParseDate(dateInput), []);

  const formatDate = useCallback((dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return "";
    return date.toLocaleDateString();
  }, [parseDate]);

  const isOverdue = useCallback((dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < now;
  }, [parseDate]);

  const isToday = useCallback((dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [parseDate]);

  const isThisWeek = useCallback((dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return false;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    
    // Set to start of week (Sunday)
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    // Set to end of week (Saturday)
    weekEnd.setDate(today.getDate() - dayOfWeek + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
  }, [parseDate]);

  // Legacy function kept for backward compatibility - now uses cached version
  function extractTaskDate(taskText) {
    return getCachedTaskDate(taskText);
  }
  
  // Optimized single-pass data processing pipeline
  const sectionData = useMemo(() => {
    
    const result = {};
    const query = config.ui.searchQuery?.toLowerCase() || '';
    const hasSearch = Boolean(query);
    const hasAdvancedFilter = config.display.filterBy !== 'all';
    const maxItems = config.display.maxItemsPerSection;
    const sortBy = config.display.sortBy;
    
    // Create a sorting comparator once
    const createSortComparator = (type) => {
      switch (sortBy) {
        case 'name':
          return (a, b) => {
            const nameA = type === 'note' ? a.$name : a.$text;
            const nameB = type === 'note' ? b.$name : b.$text;
            return nameA.localeCompare(nameB);
          };
        
        case 'date':
          return (a, b) => {
            const dateA = type === 'note' 
              ? extractFrontmatterValue(a.$frontmatter?.[config.scheduling.datePropertyName])
              : getCachedTaskDate(a.$text);
            const dateB = type === 'note' 
              ? extractFrontmatterValue(b.$frontmatter?.[config.scheduling.datePropertyName])
              : getCachedTaskDate(b.$text);
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            return (cachedParseDate(dateA)?.getTime() || 0) - (cachedParseDate(dateB)?.getTime() || 0);
          };
        
        case 'priority':
        default:
          return (a, b) => {
            const dateA = type === 'note' 
              ? extractFrontmatterValue(a.$frontmatter?.[config.scheduling.datePropertyName])
              : getCachedTaskDate(a.$text);
            const dateB = type === 'note' 
              ? extractFrontmatterValue(b.$frontmatter?.[config.scheduling.datePropertyName])
              : getCachedTaskDate(b.$text);
            const isOverdueA = isOverdue(dateA);
            const isOverdueB = isOverdue(dateB);
            
            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;
            return 0;
          };
      }
    };
    
    Object.entries(config.sections).forEach(([sectionKey, section]) => {
      const processedNotes = [];
      const processedTasks = [];
      
      // Process notes in single pass
      if (config.display.showNotes && notes && Array.isArray(notes) && section?.propertyRules?.enabled) {
        try {
          const noteSorter = createSortComparator('note');
          
          for (const note of notes) {
            if (!note?.$frontmatter) continue;
            
            // Check property match
            const propValue = note.$frontmatter[section.propertyRules.propertyName];
            const actualValue = extractFrontmatterValue(propValue);
            if (actualValue !== section.propertyRules.propertyValue) continue;
            
            // Apply search filter
            if (hasSearch && !note.$name?.toLowerCase().includes(query)) continue;
            
            // Apply advanced filter
            if (hasAdvancedFilter) {
              const dateRaw = note.$frontmatter?.[config.scheduling.datePropertyName];
              const date = extractFrontmatterValue(dateRaw);
              
              switch (config.display.filterBy) {
                case 'overdue': if (!isOverdue(date)) continue; break;
                case 'today': if (!isToday(date)) continue; break;
                case 'week': if (!isThisWeek(date)) continue; break;
                case 'pending': break;
                default: break;
              }
            }
            
            processedNotes.push(note);
          }
          
          // Sort notes
          processedNotes.sort(noteSorter);
        } catch (err) {
          console.warn(`Error processing notes for section ${sectionKey}:`, err);
        }
      }
      
      // Process tasks in single pass
      if (config.display.showTasks && tasks && Array.isArray(tasks) && section?.taskRules?.enabled) {
        try {
          const taskSorter = createSortComparator('task');
          
          for (const task of tasks) {
            if (!task?.$tags || !Array.isArray(task.$tags)) continue;
            if (!config.display.showCompleted && task.$completed) continue;
            
            // Check tag match
            const hasTag = task.$tags.some(tag => {
              const cleanTag = extractTagValue(tag);
              return cleanTag === section.taskRules.tagName;
            });
            if (!hasTag) continue;
            
            // Apply search filter
            if (hasSearch && !task.$text?.toLowerCase().includes(query)) continue;
            
            // Apply advanced filter
            if (hasAdvancedFilter) {
              const date = getCachedTaskDate(task.$text);
              switch (config.display.filterBy) {
                case 'overdue': if (!isOverdue(date)) continue; break;
                case 'today': if (!isToday(date)) continue; break;
                case 'week': if (!isThisWeek(date)) continue; break;
                case 'completed': if (!task.$completed) continue; break;
                case 'pending': if (task.$completed) continue; break;
                default: break;
              }
            }
            
            processedTasks.push(task);
          }
          
          // Sort tasks
          processedTasks.sort(taskSorter);
        } catch (err) {
          console.warn(`Error processing tasks for section ${sectionKey}:`, err);
        }
      }
      
      // Apply combined limit to notes and tasks if maxItems is set
      if (maxItems > 0) {
        const totalItems = processedNotes.length + processedTasks.length;
        
        if (totalItems > maxItems) {
          // When both notes and tasks exist, distribute the limit proportionally
          if (processedNotes.length > 0 && processedTasks.length > 0) {
            const noteRatio = processedNotes.length / totalItems;
            const notesLimit = Math.max(1, Math.round(maxItems * noteRatio));
            const tasksLimit = Math.max(1, maxItems - notesLimit);
            
            processedNotes.length = Math.min(processedNotes.length, notesLimit);
            processedTasks.length = Math.min(processedTasks.length, tasksLimit);
          } else if (processedNotes.length > 0) {
            // Only notes, apply full limit
            processedNotes.length = Math.min(processedNotes.length, maxItems);
          } else if (processedTasks.length > 0) {
            // Only tasks, apply full limit
            processedTasks.length = Math.min(processedTasks.length, maxItems);
          }
        }
      }
      
      result[sectionKey] = {
        ...section,
        notes: processedNotes,
        tasks: processedTasks
      };
    });
    
    return result;
  }, [notes, tasks, config.sections, config.display, config.ui.searchQuery, config.scheduling.datePropertyName, getCachedTaskDate, parseDate, isOverdue, isToday, isThisWeek]);

  // Enhanced Statistics Calculation with Advanced Metrics
  const calculatedStats = useMemo(() => {
    const newStats = {};
    let totalItems = 0;
    let totalNotes = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let todayTasks = 0;
    let weekTasks = 0;
    let unscheduledItems = 0;
    let recurringItems = 0;
    
    // Time tracking
    const tasksByDate = new Map();
    const completionDates = [];
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Quadrant distribution
    const quadrantBalance = {};

    Object.entries(sectionData).forEach(([sectionKey, section]) => {
      const sectionTotal = section.notes.length + section.tasks.length;
      totalItems += sectionTotal;
      totalNotes += section.notes.length;
      totalTasks += section.tasks.length;
      
      // Track quadrant balance
      quadrantBalance[sectionKey] = sectionTotal;
      
      // Pre-calculate metrics without re-filtering
      let sectionCompleted = 0;
      let sectionOverdue = 0;
      let sectionToday = 0;
      let sectionWeek = 0;
      let sectionUnscheduled = 0;
      let sectionRecurring = 0;
      
      // Process tasks once
      section.tasks.forEach(task => {
        if (task.$completed) {
          sectionCompleted++;
          // Track completion date
          if (task.$completedDate) {
            completionDates.push(task.$completedDate);
          }
        }
        
        const taskDate = getCachedTaskDate(task.$text);
        if (taskDate) {
          const dateStr = parseDate(taskDate)?.toISOString().split('T')[0];
          if (dateStr) {
            tasksByDate.set(dateStr, (tasksByDate.get(dateStr) || 0) + 1);
          }
          
          if (isOverdue(taskDate)) sectionOverdue++;
          if (isToday(taskDate)) sectionToday++;
          if (isThisWeek(taskDate)) sectionWeek++;
        } else if (!task.$completed) {
          sectionUnscheduled++;
        }
      });
      
      // Process notes once
      section.notes.forEach(note => {
        const noteDate = extractFrontmatterValue(note.$frontmatter?.[config.scheduling.datePropertyName]);
        const noteRecurring = extractFrontmatterValue(note.$frontmatter?.[config.scheduling.recurringPropertyName]);
        
        if (noteDate) {
          const dateStr = parseDate(noteDate)?.toISOString().split('T')[0];
          if (dateStr) {
            tasksByDate.set(dateStr, (tasksByDate.get(dateStr) || 0) + 1);
          }
          
          if (isOverdue(noteDate)) sectionOverdue++;
          if (isToday(noteDate)) sectionToday++;
          if (isThisWeek(noteDate)) sectionWeek++;
        } else {
          sectionUnscheduled++;
        }
        
        if (noteRecurring) {
          sectionRecurring++;
          recurringItems++;
        }
      });
      
      newStats[sectionKey] = {
        total: sectionTotal,
        notes: section.notes.length,
        tasks: section.tasks.length,
        completed: sectionCompleted,
        overdue: sectionOverdue,
        today: sectionToday,
        week: sectionWeek,
        unscheduled: sectionUnscheduled,
        recurring: sectionRecurring,
        completionRate: section.tasks.length > 0 ? Math.round((sectionCompleted / section.tasks.length) * 100) : 0
      };

      completedTasks += sectionCompleted;
      overdueTasks += sectionOverdue;
      todayTasks += sectionToday;
      weekTasks += sectionWeek;
      unscheduledItems += sectionUnscheduled;
    });

    // Calculate total tasks for completion rate
    const totalTasksInSections = Object.values(sectionData).reduce((sum, section) => sum + section.tasks.length, 0);
    
    // Calculate productivity metrics
    const completedThisWeek = completionDates.filter(date => {
      const d = new Date(date);
      return d >= weekAgo && d <= today;
    }).length;
    
    // Calculate average daily completions
    const avgDailyCompletions = completedThisWeek / 7;
    
    // Calculate workload distribution (Gini coefficient-like metric)
    const quadrantValues = Object.values(quadrantBalance);
    const avgQuadrantSize = totalItems / quadrantValues.length;
    const workloadBalance = quadrantValues.reduce((acc, val) => {
      return acc + Math.abs(val - avgQuadrantSize);
    }, 0) / (2 * totalItems);
    
    // Advanced metrics calculations
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const completedLastMonth = completionDates.filter(date => {
      const d = new Date(date);
      return d >= monthAgo && d <= today;
    }).length;
    
    // Calculate momentum (completion rate trend)
    const recentCompletionRate = completedThisWeek / Math.max(weekTasks, 1);
    const monthlyCompletionRate = completedLastMonth / Math.max(totalTasks, 1);
    const momentum = ((recentCompletionRate - monthlyCompletionRate) * 100).toFixed(1);
    
    // Calculate urgency index
    const urgencyIndex = Math.round((overdueTasks + todayTasks) / Math.max(totalItems, 1) * 100);
    
    // Calculate focus score (how well items are distributed by priority)
    const quadrantPriorities = { urgent_important: 4, not_urgent_important: 3, urgent_not_important: 2, not_urgent_not_important: 1 };
    const focusScore = Object.entries(quadrantBalance).reduce((score, [quad, count]) => {
      const priority = quadrantPriorities[quad] || 2.5;
      return score + (priority * count);
    }, 0) / Math.max(totalItems, 1);
    
    // Time to completion estimate (based on current velocity)
    const remainingTasks = totalTasksInSections - completedTasks;
    const daysToComplete = avgDailyCompletions > 0 ? Math.ceil(remainingTasks / avgDailyCompletions) : null;
    
    // Activity heat map data
    const activityByDayHour = new Map();
    [...tasksByDate.entries()].forEach(([dateStr, count]) => {
      const date = new Date(dateStr);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      activityByDayHour.set(key, (activityByDayHour.get(key) || 0) + count);
    });
    
    // Weekly patterns
    const weeklyPattern = Array.from({ length: 7 }, (_, i) => {
      const dayTasks = [...tasksByDate.entries()].filter(([dateStr]) => {
        return new Date(dateStr).getDay() === i;
      }).reduce((sum, [, count]) => sum + count, 0);
      return dayTasks;
    });
    
    // Quadrant efficiency (completion rate per quadrant)
    const quadrantEfficiency = {};
    Object.entries(newStats).forEach(([quad, stats]) => {
      if (quad !== 'summary') {
        quadrantEfficiency[quad] = stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 100) : 0;
      }
    });
    
    newStats.summary = {
      totalItems,
      totalNotes,
      totalTasks,
      completedTasks,
      overdueTasks,
      todayTasks,
      weekTasks,
      unscheduledItems,
      recurringItems,
      completionRate: totalTasksInSections > 0 ? Math.round((completedTasks / totalTasksInSections) * 100) : 0,
      productivityScore: Math.round(100 - (overdueTasks / Math.max(totalTasks, 1)) * 100),
      completedThisWeek,
      avgDailyCompletions: avgDailyCompletions.toFixed(1),
      workloadBalance: (1 - workloadBalance).toFixed(2),
      tasksByDate: Array.from(tasksByDate.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      quadrantBalance,
      // New advanced metrics
      completedLastMonth,
      momentum,
      urgencyIndex,
      focusScore: focusScore.toFixed(2),
      daysToComplete,
      activityHeatMap: Array.from(activityByDayHour.entries()),
      weeklyPattern,
      quadrantEfficiency,
      velocityTrend: completedThisWeek > 0 ? ((completedThisWeek - (completedLastMonth / 4)) / completedThisWeek * 100).toFixed(1) : 0
    };

    return newStats;
  }, [sectionData, config.scheduling.datePropertyName, config.scheduling.recurringPropertyName, getCachedTaskDate, parseDate, isToday, isThisWeek]);
  
  // Update stats state when calculated stats change
  useEffect(() => {
    setAppState(prev => ({ ...prev, stats: calculatedStats }));
  }, [calculatedStats]);

  /**************************************************************
   * Event Handlers - Optimized Config Updates
   **************************************************************/
  const updateConfig = useCallback((path, value) => {
    setConfig(prev => {
      const keys = path.split('.');
      
      // Shallow update optimization
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      }
      
      if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value
          }
        };
      }
      
      if (keys.length === 3) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: {
              ...prev[keys[0]][keys[1]],
              [keys[2]]: value
            }
          }
        };
      }
      
      // Fallback to deep update only for complex nested paths
      const newConfig = JSON.parse(JSON.stringify(prev));
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newConfig;
    });
  }, []);

  // Optimized callbacks for memoized components
  const handleItemClick = useCallback((item, type) => {
    if (type === "note") {
      if (item.$path) {
        app.workspace.openLinkText(item.$path, "");
      }
    } else {
      // For tasks, open parent file
      if (item.$file) {
        app.workspace.openLinkText(item.$file, "");
      }
    }
  }, []);

  // Drag and Drop Handlers
  function handleDragStart(e, item, type) {
    setInteractionState(prev => ({ ...prev, draggedItem: { item, type } }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a simplified version of the item without circular references
    const dragData = {
      type,
      itemData: type === 'note' ? {
        path: item.$path,
        name: item.$name,
        frontmatter: item.$frontmatter
      } : {
        file: item.$file,
        line: item.$line,
        text: item.$text,
        tags: item.$tags,
        completed: item.$completed
      }
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  function handleDragOver(e, sectionKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // No visual changes - just allow drop
    
    // Keep dragged element opacity
    const draggedElement = document.querySelector('[data-dragging="true"]');
    if (draggedElement) {
      draggedElement.style.opacity = '0.5';
    }
  }

  function handleDragLeave(e) {
    // No visual changes needed
  }
  
  function handleDragEnd(e) {
    // Clear all drag states when drag ends
    setInteractionState(prev => ({ 
      ...prev, 
      draggedItem: null,
      dragOverSection: null 
    }));
  }

  async function handleDrop(e, targetSectionKey) {
    e.preventDefault();

    if (!interactionState.draggedItem || !targetSectionKey) return;

    const targetSection = config.sections[targetSectionKey];
    if (!targetSection) return;

    try {
      if (interactionState.draggedItem.type === 'note') {
        // Update note frontmatter
        await updateNoteFrontmatter(
          interactionState.draggedItem.item,
          targetSection.propertyRules.propertyName,
          targetSection.propertyRules.propertyValue
        );
      } else if (interactionState.draggedItem.type === 'task') {
        // Update task tags
        await updateTaskTag(
          interactionState.draggedItem.item,
          targetSection.taskRules.tagName
        );
      }

      addNotification(
        `${COMMON_CONSTANTS.ICONS.success} Moved ${interactionState.draggedItem.type} to ${targetSection.title}`,
        'success'
      );
    } catch (error) {
      handleError(error, { operation: 'dragDrop', targetSection: targetSectionKey });
    } finally {
      // Always clear drag state, even on error
      setInteractionState(prev => ({ ...prev, draggedItem: null }));
    }
  }

  async function updateNoteFrontmatter(note, propertyName, propertyValue) {
    const file = app.vault.getAbstractFileByPath(note.$path);
    if (!file) return;

    // Implement file locking to prevent concurrent modifications
    const filePath = note.$path;
    
    // Check if file is currently locked
    if (fileLocksRef.current.has(filePath)) {
      // Queue this update for later
      if (!fileUpdateQueueRef.current.has(filePath)) {
        fileUpdateQueueRef.current.set(filePath, []);
      }
      fileUpdateQueueRef.current.get(filePath).push({ propertyName, propertyValue });
      return;
    }
    
    // Lock the file with timestamp
    fileLocksRef.current.set(filePath, Date.now());
    
    // Schedule non-blocking update
    const performUpdate = async () => {
    
      try {
        // Use Obsidian's built-in processFrontMatter API for atomic updates
        await app.fileManager.processFrontMatter(file, (frontmatter) => {
          // Simply set the property - Obsidian handles all the complexity
          frontmatter[propertyName] = propertyValue;
          
          // Process any queued updates while we have the file open
          const queuedUpdates = fileUpdateQueueRef.current.get(filePath);
          if (queuedUpdates && queuedUpdates.length > 0) {
            queuedUpdates.forEach(update => {
              frontmatter[update.propertyName] = update.propertyValue;
            });
            fileUpdateQueueRef.current.delete(filePath);
          }
        });
    } catch (error) {
      // Fallback to manual processing if processFrontMatter fails
      console.error('processFrontMatter failed, using fallback:', error);
      
      try {
        const content = await app.vault.read(file);
        let newContent = content;

        // Enhanced regex to handle various frontmatter formats
        // This regex handles:
        // - Optional carriage returns (\r\n or \n)
        // - Empty frontmatter blocks
        // - No newline after closing ---
        // - MULTIPLE frontmatter blocks (global flag)
        const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/gm;
        
        let allProperties = {};
        let processedContent = content;
        let lastMatchEnd = 0;
        
        // Extract ALL frontmatter blocks (handles duplicates)
        let match;
        let tempContent = content;
        
        // Keep finding frontmatter blocks from the start of remaining content
        while (tempContent.trimStart().startsWith('---')) {
          tempContent = tempContent.trimStart();
          const singleMatch = tempContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
          
          if (!singleMatch) break;
          
          const frontmatterText = singleMatch[1];
          const lines = frontmatterText.split(/\r?\n/);
          
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim();
              if (key) {
                allProperties[key] = value;
              }
            }
          });
          
          // Remove this frontmatter block and continue
          tempContent = tempContent.substring(singleMatch[0].length);
          lastMatchEnd = content.length - tempContent.length;
        }
        
        // Get content after all frontmatter blocks
        const mainContent = tempContent.trimStart();
        
        // Update the property
        allProperties[propertyName] = propertyValue;
        
        // Process any queued updates
        const queuedUpdates = fileUpdateQueueRef.current.get(filePath);
        if (queuedUpdates && queuedUpdates.length > 0) {
          queuedUpdates.forEach(update => {
            allProperties[update.propertyName] = update.propertyValue;
          });
          fileUpdateQueueRef.current.delete(filePath);
        }
        
        // Rebuild content with sorted properties
        const sortedKeys = Object.keys(allProperties).sort((a, b) => {
          if (a === 'eisenhower_status') return -1;
          if (b === 'eisenhower_status') return 1;
          return a.localeCompare(b);
        });
        
        const frontmatterLines = sortedKeys.map(key => `${key}: ${allProperties[key]}`);
        newContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${mainContent}`;
        
        await app.vault.modify(file, newContent);
      } catch (fallbackError) {
        handleError(fallbackError, { 
          operation: 'updateNoteFrontmatter', 
          note: note.$path,
          property: propertyName 
        });
      }
      } finally {
        // Always unlock the file
        fileLocksRef.current.delete(filePath);
        
        // Process any remaining queued updates
        const remainingUpdates = fileUpdateQueueRef.current.get(filePath);
        if (remainingUpdates && remainingUpdates.length > 0) {
          const nextUpdate = remainingUpdates.shift();
          if (remainingUpdates.length === 0) {
            fileUpdateQueueRef.current.delete(filePath);
          }
          // Process the next update
          setTimeout(() => {
            updateNoteFrontmatter(note, nextUpdate.propertyName, nextUpdate.propertyValue);
          }, 50);
        }
      }
    };
    
    // Use requestIdleCallback if available for non-blocking updates
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(performUpdate, { timeout: 2000 });
    } else {
      // Fallback to setTimeout
      setTimeout(performUpdate, 0);
    }
  }

  async function updateTaskTag(task, newTag) {
    const file = app.vault.getAbstractFileByPath(task.$file);
    if (!file) return;

    const content = await app.vault.read(file);
    const lines = content.split('\n');
    
    // Find the task line
    const taskLineIndex = lines.findIndex(line => 
      line.includes(task.$text) && 
      (task.$tags?.length === 0 || task.$tags?.some(tag => {
        const tagStr = typeof tag === 'object' ? (tag.value || tag.raw || tag.tag || tag) : tag;
        return line.includes(tagStr);
      }))
    );

    if (taskLineIndex === -1) return;

    let taskLine = lines[taskLineIndex];

    // Remove existing eisenhower tags
    Object.values(config.sections).forEach(section => {
      if (section.taskRules?.enabled) {
        const tagToRemove = section.taskRules.tagName;
        taskLine = taskLine.replace(new RegExp(`#${tagToRemove}\\b`, 'gi'), '');
      }
    });

    // Add new tag
    taskLine = taskLine.trim() + ` #${newTag}`;
    lines[taskLineIndex] = taskLine;

    await app.vault.modify(file, lines.join('\n'));
  }

  // Extracted task completion toggle handler to eliminate duplication
  const handleTaskToggle = useCallback(async (task, checked) => {
    try {
      const file = app.vault.getAbstractFileByPath(task.$file);
      if (file) {
        const content = await app.vault.read(file);
        const lines = content.split('\n');
        const taskLineIndex = lines.findIndex(line => 
          line.includes(task.$text) && line.includes(task.$tags?.[0] || '')
        );
        if (taskLineIndex !== -1) {
          const currentLine = lines[taskLineIndex];
          const newLine = checked 
            ? currentLine.replace('- [ ]', '- [x]')
            : currentLine.replace('- [x]', '- [ ]');
          lines[taskLineIndex] = newLine;
          await app.vault.modify(file, lines.join('\n'));
        }
      }
    } catch (error) {
      handleError(error, { operation: 'toggleTask' });
    }
  }, []);
  
  // Debounced search handler for better performance
  const debouncedUpdateSearch = useMemo(
    () => debounce((value) => updateConfig('ui.searchQuery', value), 300),
    [updateConfig]
  );

  async function clearNoteProperties(note) {
    try {
      const file = app.vault.getAbstractFileByPath(note.$path);
      if (!file) return;
      
      // Check if file is locked and wait if necessary
      const filePath = note.$path;
      const maxWaitTime = 2000; // 2 seconds max wait
      const startTime = Date.now();
      
      while (fileLocksRef.current.has(filePath)) {
        if (Date.now() - startTime > maxWaitTime) {
          addNotification('File is busy, please try again', 'error');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Lock the file with timestamp
      fileLocksRef.current.set(filePath, Date.now());
      
      try {
        // Use Obsidian's native API if available
        if (app.fileManager && app.fileManager.processFrontMatter) {
          const propertiesToClear = new Set(['due_date', 'recurring']);
          Object.values(config.sections).forEach(section => {
            if (section.propertyRules?.enabled && section.propertyRules.propertyName) {
              propertiesToClear.add(section.propertyRules.propertyName);
            }
          });
          
          await app.fileManager.processFrontMatter(file, (frontmatter) => {
            propertiesToClear.forEach(prop => {
              delete frontmatter[prop];
            });
          });
        } else {
          // Fallback: manual processing
          const content = await app.vault.read(file);
          let newContent = content;
          
          // Extract all existing frontmatter properties (handling multiple blocks)
          let allProperties = {};
          let tempContent = content;
          
          // Keep finding frontmatter blocks from the start
          while (tempContent.trimStart().startsWith('---')) {
            tempContent = tempContent.trimStart();
            const singleMatch = tempContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
            
            if (!singleMatch) break;
            
            const frontmatterText = singleMatch[1];
            const lines = frontmatterText.split(/\r?\n/);
            
            lines.forEach(line => {
              const trimmed = line.trim();
              if (trimmed && trimmed.includes(':')) {
                const colonIndex = trimmed.indexOf(':');
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();
                if (key) {
                  allProperties[key] = value;
                }
              }
            });
            
            // Remove this frontmatter block and continue
            tempContent = tempContent.substring(singleMatch[0].length);
          }
          
          // Get content after all frontmatter blocks
          const mainContent = tempContent.trimStart();
          
          // Remove the properties we want to clear
          const propertiesToClear = new Set(['due_date', 'recurring']);
          Object.values(config.sections).forEach(section => {
            if (section.propertyRules?.enabled && section.propertyRules.propertyName) {
              propertiesToClear.add(section.propertyRules.propertyName);
            }
          });
          
          propertiesToClear.forEach(prop => {
            delete allProperties[prop];
          });
          
          // Rebuild content
          const remainingKeys = Object.keys(allProperties);
          if (remainingKeys.length > 0) {
            const sortedKeys = remainingKeys.sort((a, b) => a.localeCompare(b));
            const frontmatterLines = sortedKeys.map(key => `${key}: ${allProperties[key]}`);
            newContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${mainContent}`;
          } else {
            // No properties left, remove frontmatter entirely
            newContent = mainContent;
          }
          
          await app.vault.modify(file, newContent);
        }
        
        addNotification('Properties cleared successfully', 'success');
      } catch (innerError) {
        throw innerError;
      } finally {
        // Always unlock the file
        fileLocksRef.current.delete(filePath);
      }
    } catch (error) {
      handleError(error, { operation: 'clearNoteProperties', note: note.$name });
    }
  }

  /**************************************************************
   * Quadrant Management Functions
   **************************************************************/
  function addQuadrant(name) {
    if (!name || name.trim() === '') {
      addNotification('Please enter a quadrant name', 'error');
      return;
    }
    
    // Generate a unique key
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    const uniqueKey = `${key}_${timestamp}`;
    
    // Find the highest row number
    const maxRow = Math.max(...Object.values(config.sections).map(s => s.position.row), 0);
    
    // Create new quadrant
    const newQuadrant = {
      title: name,
      subtitle: "New Quadrant",
      description: "Configure this quadrant's rules",
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
      position: { row: maxRow + 1, col: 0 }, // Add to new row
      propertyRules: { 
        enabled: true, 
        propertyName: `${key}_status`, 
        propertyValue: key 
      },
      taskRules: { 
        enabled: true, 
        tagName: key 
      }
    };
    
    updateConfig(`sections.${uniqueKey}`, newQuadrant);
    addNotification(`Added quadrant: ${name}`, 'success');
    setUiState(prev => ({ ...prev, newQuadrantName: "" }));
  }
  
  function removeQuadrant(sectionKey) {
    const section = config.sections[sectionKey];
    if (!section) return;
    
    if (Object.keys(config.sections).length <= 1) {
      addNotification('Cannot remove the last quadrant', 'error');
      return;
    }
    
    const newSections = { ...config.sections };
    delete newSections[sectionKey];
    
    setConfig(prev => ({
      ...prev,
      sections: newSections
    }));
    
    addNotification(`Removed quadrant: ${section.title}`, 'success');
  }
  
  function updateQuadrantPosition(sectionKey, newRow, newCol) {
    // Default to 0 if empty or invalid
    const row = parseInt(newRow) || 0;
    const col = parseInt(newCol) || 0;
    
    updateConfig(`sections.${sectionKey}.position.row`, Math.max(0, row));
    updateConfig(`sections.${sectionKey}.position.col`, Math.max(0, col));
  }

  /**************************************************************
   * Minimal Professional Styling
   **************************************************************/
  // Theme computation with memoization for performance
  const [currentTheme, setCurrentTheme] = useState(() => getObsidianTheme());
  
  // Monitor theme changes via MutationObserver
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = getObsidianTheme();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    });
    
    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        attributeFilter: ['class'],
        attributeOldValue: true
      });
    }
    
    return () => observer.disconnect();
  }, [currentTheme]);
  
  const theme = useMemo(() => {
    const isDark = currentTheme === 'dark';
    
    // Get Obsidian CSS variables for true theme integration
    const computedStyle = typeof window !== 'undefined' ? window.getComputedStyle(document.body) : null;
    
    return {
      // Base colors - use Obsidian's actual theme colors
      bg: computedStyle?.getPropertyValue('--background-primary') || (isDark ? '#1e1e1e' : '#ffffff'),
      surface: computedStyle?.getPropertyValue('--background-secondary') || (isDark ? '#2a2a2a' : '#fafafa'),
      surfaceHover: computedStyle?.getPropertyValue('--background-secondary-alt') || (isDark ? '#333333' : '#f5f5f5'),
      surfaceActive: computedStyle?.getPropertyValue('--background-modifier-hover') || (isDark ? '#3a3a3a' : '#eeeeee'),
      
      // Text colors - use Obsidian's text colors
      text: computedStyle?.getPropertyValue('--text-normal') || (isDark ? '#d4d4d4' : '#1a1a1a'),
      textSecondary: computedStyle?.getPropertyValue('--text-muted') || (isDark ? '#a6a6a6' : '#666666'),
      textMuted: computedStyle?.getPropertyValue('--text-faint') || (isDark ? '#808080' : '#999999'),
      
      // Border colors - use Obsidian's border colors
      border: computedStyle?.getPropertyValue('--background-modifier-border') || (isDark ? '#404040' : '#e5e5e5'),
      borderHover: computedStyle?.getPropertyValue('--background-modifier-border-hover') || (isDark ? '#505050' : '#d5d5d5'),
      
      // Interactive colors
      accent: isDark ? '#4a9eff' : '#0066cc',
      accentHover: isDark ? '#5aa5ff' : '#0055aa',
      
      // Status colors
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      
      // Shadows
      shadow: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
      shadowHover: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)',
      
      // Card background - use Obsidian's card colors
      cardBg: computedStyle?.getPropertyValue('--background-primary') || (isDark ? '#1e1e1e' : '#ffffff')
    };
  }, [currentTheme]);

  // Optimized styles - only compute dynamic values
  const styles = useMemo(() => ({
    container: {
      ...STATIC_STYLES.baseFont,
      color: theme.text,
      background: 'transparent', // Transparent to show Obsidian's background
      minHeight: '100vh',
      padding: '0', // Remove padding to use full width
      transition: COMMON_CONSTANTS.TRANSITIONS.default,
      // Force full width in Obsidian
      width: '100% !important',
      maxWidth: '100% !important',
      margin: '0 !important'
    },
    wrapper: {
      // Override any width constraints for full width
      width: '100% !important',
      maxWidth: '100% !important',
      margin: '0 !important',
      padding: COMMON_CONSTANTS.SPACING.xl // Move padding here for content spacing
    },
    header: STATIC_STYLES.layout.header,
    headerCentered: STATIC_STYLES.layout.headerCentered,
    title: {
      ...STATIC_STYLES.typography.title,
      color: theme.text
    },
    toolbar: STATIC_STYLES.layout.toolbar,
    toolButton: {
      background: 'none',
      border: `1px solid ${theme.border}`,
      color: theme.textSecondary,
      padding: '6px 12px',
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
      cursor: 'pointer',
      fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
      fontWeight: '500',
      transition: COMMON_CONSTANTS.TRANSITIONS.fast,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '32px'
    },
    toolButtonActive: {
      background: theme.accent,
      borderColor: theme.accent,
      color: 'white'
    },
    // Main content area
    main: {
      minHeight: 'calc(100vh - 200px)'
    },
    // Matrix View
    matrixGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: COMMON_CONSTANTS.SPACING.lg,
      marginBottom: '24px'
    },
    matrixSection: {
      background: theme.surface,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
      border: `1px solid ${theme.border}`,
      boxShadow: COMMON_CONSTANTS.SHADOWS.small,
      overflow: 'hidden',
      transition: COMMON_CONSTANTS.TRANSITIONS.default,
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column'
    },
    matrixSectionHover: {
      boxShadow: `0 4px 12px ${theme.shadowHover}`
    },
    sectionHeader: {
      padding: '16px',
      borderBottom: `1px solid ${theme.border}`,
      background: theme.surfaceHover
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    sectionSubtitle: {
      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
      color: theme.textSecondary,
      margin: 0
    },
    sectionContent: {
      flex: 1,
      padding: '12px',
      overflowY: 'auto',
      maxHeight: '400px'
    },
    // Item styles
    itemCard: {
      background: theme.bg,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
      padding: '12px',
      marginBottom: '8px',
      border: `1px solid ${theme.border}`,
      cursor: 'pointer',
      transition: COMMON_CONSTANTS.TRANSITIONS.fast,
      position: 'relative'
    },
    itemCardHover: {
      borderColor: theme.borderHover,
      transform: 'translateY(-1px)',
      boxShadow: `0 2px 8px ${theme.shadow}`
    },
    itemTitle: {
      fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
      fontWeight: '500',
      color: theme.text,
      marginBottom: '6px',
      lineHeight: '1.4'
    },
    itemMeta: {
      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
      color: theme.textSecondary,
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    itemActions: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      opacity: 0,
      transition: 'opacity 0.15s ease'
    },
    clearButton: {
      background: theme.surfaceHover,
      border: `1px solid ${theme.border}`,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
      padding: '4px 8px',
      fontSize: '11px',
      color: theme.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    // List/Merged View
    listContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    mergedContainer: {
      background: theme.surface,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
      border: `1px solid ${theme.border}`,
      padding: '16px'
    },
    // Empty state
    emptyState: {
      textAlign: 'center',
      color: theme.textMuted,
      padding: '32px',
      fontSize: COMMON_CONSTANTS.FONT_SIZES.medium
    },
    // Modal/Popup styles
    modal: {
      position: 'fixed',
      top: '40px',
      left: '50%',
      right: '40px',
      bottom: '40px',
      transform: 'translateX(-50%)',
      background: theme.surface,
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      boxShadow: `0 24px 60px ${currentTheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`,
      width: '90%',
      maxWidth: '600px',
      maxHeight: 'none',
      overflow: 'hidden',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'modalSlideIn 0.2s ease-out'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: currentTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
      zIndex: 999,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    },
    modalHeader: {
      padding: '24px 28px',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: theme.bg
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      margin: 0,
      letterSpacing: '-0.02em'
    },
    modalClose: {
      background: theme.surfaceHover,
      border: 'none',
      color: theme.textSecondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
      transition: COMMON_CONSTANTS.TRANSITIONS.fast,
      width: '36px',
      height: '36px'
    },
    modalContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '0',
      background: theme.bg
    },
    // Search popup
    searchPopup: {
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: theme.surface,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
      border: `1px solid ${theme.border}`,
      boxShadow: `0 10px 30px ${theme.shadowHover}`,
      width: '90%',
      maxWidth: '500px',
      padding: '16px',
      zIndex: 1000,
      animation: 'searchSlideDown 0.2s ease-out'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${theme.border}`,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
      background: theme.bg,
      color: theme.text,
      fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
      outline: 'none',
      transition: 'all 0.15s ease'
    },
    searchInputFocus: {
      borderColor: theme.accent,
      boxShadow: `0 0 0 3px ${theme.accent}20`
    },
    // Stats styles
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: COMMON_CONSTANTS.SPACING.lg,
      marginBottom: '24px'
    },
    statCard: {
      background: theme.bg,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
      border: `1px solid ${theme.border}`,
      padding: '16px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: theme.accent,
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    // Settings tabs
    tabsContainer: {
      display: 'flex',
      background: theme.bg,
      padding: '8px',
      borderBottom: `1px solid ${theme.border}`,
      gap: '4px'
    },
    tabButton: {
      padding: '10px 20px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
      fontWeight: '500',
      color: theme.textSecondary,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
      transition: COMMON_CONSTANTS.TRANSITIONS.default,
      position: 'relative'
    },
    tabButtonActive: {
      color: theme.text,
      background: theme.surface,
      boxShadow: `0 2px 8px ${theme.shadow}`,
      fontWeight: '600'
    },
    // Form elements
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
      fontWeight: '500',
      color: theme.text,
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${theme.border}`,
      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
      background: theme.bg,
      color: theme.text,
      fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
      outline: 'none',
      transition: 'all 0.15s ease'
    },
    checkbox: {
      marginRight: '8px'
    },
    helpText: {
      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
      color: theme.textMuted,
      marginTop: '4px',
      lineHeight: '1.5'
    },
    // Responsive
    '@media (max-width: 768px)': {
      matrixGrid: {
        gridTemplateColumns: '1fr'
      }
    }
  }), [theme]);

  /**************************************************************
   * Render Functions
   **************************************************************/

  async function handleBulkMove() {
    if (!interactionState.bulkMoveTarget || interactionState.selectedItems.size === 0) return;
    
    const targetSection = config.sections[interactionState.bulkMoveTarget];
    if (!targetSection) return;
    
    try {
      const itemsToMove = [];
      
      // Collect all selected items
      unassignedItems.notes.forEach(note => {
        if (interactionState.selectedItems.has(note.$path)) {
          itemsToMove.push({ item: note, type: 'note' });
        }
      });
      
      unassignedItems.tasks.forEach(task => {
        const taskKey = `${task.$file}-${task.$line}`;
        if (interactionState.selectedItems.has(taskKey)) {
          itemsToMove.push({ item: task, type: 'task' });
        }
      });
      
      // Move all items
      for (const { item, type } of itemsToMove) {
        if (type === 'note') {
          await updateNoteFrontmatter(
            item,
            targetSection.propertyRules.propertyName,
            targetSection.propertyRules.propertyValue
          );
        } else if (type === 'task') {
          await updateTaskTag(item, targetSection.taskRules.tagName);
        }
      }
      
      addNotification(
        `Moved ${itemsToMove.length} items to ${targetSection.title}`,
        'success'
      );
      
      // Clear selection
      setInteractionState(prev => ({ ...prev, selectedItems: new Set(), bulkMoveTarget: '' }));
    } catch (error) {
      handleError(error, { operation: 'bulkMove', targetSection: interactionState.bulkMoveTarget });
    }
  }

  function renderUnassignedCockpit() {
    if (!uiState.showUnassignedCockpit) return null;

    // Filter items by type
    const filteredNotes = filterState.cockpitItemTypeFilter === "tasks" ? [] : unassignedItems.notes;
    const filteredTasks = filterState.cockpitItemTypeFilter === "notes" ? [] : unassignedItems.tasks;
    const totalUnassigned = filteredNotes.length + filteredTasks.length;

    return (
      <div style={{
        background: theme.surface,
        borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
        border: `2px dashed ${theme.accent}`,
        padding: '16px',
        marginBottom: COMMON_CONSTANTS.SPACING.xl,
        transition: 'all 0.2s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ ...styles.sectionTitle, color: theme.accent }}>
            📥 Unassigned Items
            <span style={{ 
              fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
              padding: '2px 8px',
              background: `${theme.accent}20`,
              borderRadius: '12px',
              fontWeight: '500',
              marginLeft: '8px'
            }}>
              {totalUnassigned}
            </span>
          </h3>
          <button
            onClick={() => {
              setUiState(prev => ({ ...prev, showUnassignedCockpit: false }));
              setFilterState(prev => ({ ...prev, cockpitSearchQuery: '', cockpitPathFilter: '', cockpitItemTypeFilter: 'all' }));
              setInteractionState(prev => ({ ...prev, selectedItems: new Set(), bulkMoveTarget: '' }));
            }}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textSecondary,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
              transition: COMMON_CONSTANTS.TRANSITIONS.fast
            }}
          >
            ×
          </button>
        </div>

        {/* Bulk Actions */}
        {interactionState.selectedItems.size > 0 && (
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            background: `${theme.accent}10`,
            borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, fontWeight: '500' }}>
              {interactionState.selectedItems.size} item{interactionState.selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <select
              value={interactionState.bulkMoveTarget}
              onChange={(e) => setInteractionState(prev => ({ ...prev, bulkMoveTarget: e.target.value }))}
              style={{
                padding: '6px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                background: theme.bg,
                color: theme.text,
                fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
                cursor: 'pointer',
                flex: 1
              }}
            >
              <option value="">Move to quadrant...</option>
              {Object.entries(config.sections).map(([key, section]) => (
                <option key={key} value={key}>
                  {section.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkMove}
              disabled={!interactionState.bulkMoveTarget}
              style={{
                padding: '6px 16px',
                background: interactionState.bulkMoveTarget ? theme.accent : theme.surfaceHover,
                color: interactionState.bulkMoveTarget ? 'white' : theme.textMuted,
                border: 'none',
                borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
                fontWeight: '500',
                cursor: interactionState.bulkMoveTarget ? 'pointer' : 'not-allowed',
                transition: COMMON_CONSTANTS.TRANSITIONS.fast
              }}
            >
              Move
            </button>
            <button
              onClick={handleClearSelection}
              style={{
                padding: '6px 12px',
                background: 'none',
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
                cursor: 'pointer',
                transition: COMMON_CONSTANTS.TRANSITIONS.fast
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Filter Inputs */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterState.cockpitItemTypeFilter}
            onChange={(e) => setFilterState(prev => ({ ...prev, cockpitItemTypeFilter: e.target.value }))}
            style={{
              flex: '0 0 120px',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
              background: theme.bg,
              color: theme.text,
              fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
              cursor: 'pointer',
              outline: 'none',
              transition: COMMON_CONSTANTS.TRANSITIONS.fast
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent;
              e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.border;
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="all">All Items</option>
            <option value="notes">Notes Only</option>
            <option value="tasks">Tasks Only</option>
          </select>
          <input
            type="text"
            placeholder="Filter by path..."
            value={filterState.cockpitPathFilter}
            onChange={(e) => setFilterState(prev => ({ ...prev, cockpitPathFilter: e.target.value }))}
            style={{
              flex: '0 0 35%',
              minWidth: '150px',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
              background: theme.bg,
              color: theme.text,
              fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
              outline: 'none',
              transition: COMMON_CONSTANTS.TRANSITIONS.fast
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent;
              e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.border;
              e.target.style.boxShadow = 'none';
            }}
            title="e.g., 'Work/', 'Projects/Active', etc."
          />
          <input
            type="text"
            placeholder="Search unassigned items..."
            value={filterState.cockpitSearchQuery}
            onChange={(e) => setFilterState(prev => ({ ...prev, cockpitSearchQuery: e.target.value }))}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
              background: theme.bg,
              color: theme.text,
              fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
              outline: 'none',
              transition: COMMON_CONSTANTS.TRANSITIONS.fast
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent;
              e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.border;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Select All/None Controls */}
        {totalUnassigned > 0 && (
          <div style={{
            marginBottom: '8px',
            display: 'flex',
            gap: COMMON_CONSTANTS.SPACING.sm,
            fontSize: COMMON_CONSTANTS.FONT_SIZES.medium
          }}>
            <button
              onClick={() => {
                const allKeys = new Set();
                if (filterState.cockpitItemTypeFilter !== "tasks") {
                  filteredNotes.forEach(note => allKeys.add(note.$path));
                }
                if (filterState.cockpitItemTypeFilter !== "notes") {
                  filteredTasks.forEach(task => allKeys.add(`${task.$file}-${task.$line}`));
                }
                setInteractionState(prev => ({ ...prev, selectedItems: allKeys }));
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.accent,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
                transition: COMMON_CONSTANTS.TRANSITIONS.fast
              }}
            >
              Select All ({totalUnassigned})
            </button>
            {interactionState.selectedItems.size > 0 && (
              <button
                onClick={handleClearSelection}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
                  transition: COMMON_CONSTANTS.TRANSITIONS.fast
                }}
              >
                Select None
              </button>
            )}
          </div>
        )}

        <div style={{
          padding: '12px',
          background: theme.bg,
          borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
          border: `1px solid ${theme.border}`,
          minHeight: '100px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {totalUnassigned === 0 && !filterState.cockpitSearchQuery && !filterState.cockpitPathFilter ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>✅</div>
              <div>All items are assigned to quadrants!</div>
            </div>
          ) : totalUnassigned === 0 && (filterState.cockpitSearchQuery || filterState.cockpitPathFilter) ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>🔍</div>
              <div>
                No unassigned items found
                {filterState.cockpitPathFilter && <div style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, marginTop: '4px', color: theme.textMuted }}>
                  Path filter: "{filterState.cockpitPathFilter}"
                </div>}
                {filterState.cockpitSearchQuery && <div style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, marginTop: '4px', color: theme.textMuted }}>
                  Search: "{filterState.cockpitSearchQuery}"
                </div>}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredNotes.map(note => {
                const itemKey = note.$path;
                const isSelected = interactionState.selectedItems.has(itemKey);
                return (
                  <div key={itemKey} style={{ display: 'flex', alignItems: 'flex-start', gap: COMMON_CONSTANTS.SPACING.sm }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = new Set(interactionState.selectedItems);
                        if (e.target.checked) {
                          newSelected.add(itemKey);
                        } else {
                          newSelected.delete(itemKey);
                        }
                        setInteractionState(prev => ({ ...prev, selectedItems: newSelected }));
                      }}
                      style={{
                        marginTop: '12px',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <OptimizedItem
                        item={note}
                        type="note"
                        sectionColor={theme.accent}
                        theme={theme}
                        config={config}
                        onItemClick={handleItemClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        interactionState={interactionState}
                        isDraggable={true}
                        handleTaskToggle={handleTaskToggle}
                      />
                    </div>
                  </div>
                );
              })}
              {filteredTasks.map(task => {
                const itemKey = `${task.$file}-${task.$line}`;
                const isSelected = interactionState.selectedItems.has(itemKey);
                return (
                  <div key={itemKey} style={{ display: 'flex', alignItems: 'flex-start', gap: COMMON_CONSTANTS.SPACING.sm }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = new Set(interactionState.selectedItems);
                        if (e.target.checked) {
                          newSelected.add(itemKey);
                        } else {
                          newSelected.delete(itemKey);
                        }
                        setInteractionState(prev => ({ ...prev, selectedItems: newSelected }));
                      }}
                      style={{
                        marginTop: '12px',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <OptimizedItem
                        item={task}
                        type="task"
                        sectionColor={theme.accent}
                        theme={theme}
                        config={config}
                        onItemClick={handleItemClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        interactionState={interactionState}
                        isDraggable={true}
                        handleTaskToggle={handleTaskToggle}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: `${theme.accent}10`,
          borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
          fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
          color: theme.textSecondary,
          textAlign: 'center'
        }}>
          🎯 Drag items to the appropriate quadrant below to organize them
        </div>
      </div>
    );
  }


  function renderMatrixSection(sectionKey, section) {
    const totalItems = section.notes.length + section.tasks.length;
    const [isHovered, setIsHovered] = useState(false);
    
    // Reset hover state when drag ends
    useEffect(() => {
      if (!interactionState.draggedItem && isHovered) {
        setIsHovered(false);
      }
    }, [interactionState.draggedItem]);
    
    return (
      <div
        key={sectionKey}
        style={{
          ...styles.matrixSection,
          ...(isHovered && !interactionState.draggedItem ? styles.matrixSectionHover : {})
          // No visual changes during drag operations
        }}
        onMouseEnter={() => {
          // Don't trigger hover effects while dragging
          if (!interactionState.draggedItem) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => handleDragOver(e, sectionKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, sectionKey)}
      >
        <div style={styles.sectionHeader}>
          <h3 style={{ ...styles.sectionTitle, color: section.color }}>
            {section.title}
            <span style={{ 
              fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
              padding: '2px 8px',
              background: `${section.color}20`,
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.pill,
              fontWeight: '600',
              marginLeft: COMMON_CONSTANTS.SPACING.sm,
              border: `1px solid ${section.color}30`
            }}>
              {totalItems}
            </span>
          </h3>
          <div style={styles.sectionSubtitle}>
            {section.subtitle}
          </div>
          {config.display.showDescriptions && (
            <div style={{ ...styles.sectionSubtitle, fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>
              {section.description}
            </div>
          )}
        </div>
        
        <div style={styles.sectionContent}>
          {totalItems === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: COMMON_CONSTANTS.SPACING.sm, 
                opacity: 0.2,
                animation: COMMON_CONSTANTS.ANIMATIONS.pulse
              }}>
                {COMMON_CONSTANTS.ICONS.inbox}
              </div>
              <div style={{ color: theme.textMuted, fontSize: COMMON_CONSTANTS.FONT_SIZES.medium }}>
                Drop items here to organize
              </div>
            </div>
          ) : (
            <>
              {config.display.showNotes && section.notes.map(note => 
                <OptimizedItem 
                  key={note.$path} 
                  item={note} 
                  type="note" 
                  sectionColor={section.color}
                  theme={theme}
                  config={config}
                  onItemClick={handleItemClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  interactionState={interactionState}
                  handleTaskToggle={handleTaskToggle}
                />
              )}
              {config.display.showTasks && section.tasks.map(task => 
                <OptimizedItem 
                  key={`${task.$file}-${task.$line}`} 
                  item={task} 
                  type="task" 
                  sectionColor={section.color}
                  theme={theme}
                  config={config}
                  onItemClick={handleItemClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  interactionState={interactionState}
                  handleTaskToggle={handleTaskToggle}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderSearchPopup() {
    if (!config.ui.showSearch) return null;

    // Get search results
    const searchResults = [];
    if (config.ui.searchQuery) {
      const query = config.ui.searchQuery.toLowerCase();
      Object.entries(sectionData).forEach(([sectionKey, section]) => {
        section.notes.forEach(note => {
          if (note.$name?.toLowerCase().includes(query)) {
            searchResults.push({ item: note, type: 'note', section: section });
          }
        });
        section.tasks.forEach(task => {
          if (task.$text?.toLowerCase().includes(query)) {
            searchResults.push({ item: task, type: 'task', section: section });
          }
        });
      });
    }

    return (
      <>
        <div 
          style={styles.modalOverlay} 
          onClick={() => {
            updateConfig('ui.showSearch', false);
            updateConfig('ui.searchQuery', '');
          }}
        />
        <div style={{
          ...styles.searchPopup,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search notes and tasks..."
            defaultValue={config.ui.searchQuery}
            onChange={(e) => debouncedUpdateSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                updateConfig('ui.showSearch', false);
                updateConfig('ui.searchQuery', '');
              }
            }}
            style={styles.searchInput}
            autoFocus
          />
          
          {/* Search Results */}
          {config.ui.searchQuery && (
            <div style={{
              marginTop: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              borderTop: `1px solid ${theme.border}`,
              paddingTop: '12px'
            }}>
              {searchResults.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: theme.textMuted,
                  padding: '16px',
                  fontSize: COMMON_CONSTANTS.FONT_SIZES.medium
                }}>
                  No results found for "{config.ui.searchQuery}"
                </div>
              ) : (
                <>
                  <div style={{
                    fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
                    color: theme.textSecondary,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.item.$path || result.item.$line}-${index}`}
                        style={{
                          ...styles.itemCard,
                          marginBottom: 0,
                          padding: '8px 12px',
                          borderLeft: `3px solid ${result.section.color}`,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (result.type === 'note') {
                            if (result.item.$path) {
                              app.workspace.openLinkText(result.item.$path, "");
                            }
                          } else {
                            if (result.item.$file) {
                              app.workspace.openLinkText(result.item.$file, "");
                            }
                          }
                          updateConfig('ui.showSearch', false);
                          updateConfig('ui.searchQuery', '');
                        }}
                      >
                        <div style={{
                          fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          {result.type === 'note' ? '📄' : '☐'} {result.item.$name || result.item.$text}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme.textSecondary,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{result.section.title}</span>
                          <span>{result.type === 'note' ? 'Note' : 'Task'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderStatsPopup() {
    if (!config.ui.showStats) return null;
    
    // Professional corporate color palette
    const chartColors = {
      primary: '#2563eb',      // Professional blue
      secondary: '#64748b',    // Slate gray
      success: '#059669',      // Forest green
      warning: '#d97706',      // Amber
      danger: '#dc2626',       // Crimson
      info: '#0891b2',         // Cyan
      neutral: '#6b7280',      // Gray
      muted: '#94a3b8',        // Light slate
      background: {
        light: '#f8fafc',
        medium: '#f1f5f9',
        dark: '#e2e8f0'
      }
    };
    
    // Professional bar chart component
    const BarChart = ({ data, maxValue, color, showPercentage = false, height = 16, minimal = false }) => {
      if (!data || data.length === 0) return null;
      
      const actualMaxValue = maxValue || Math.max(...data.map(d => d[1] || 0), 1);
      
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: minimal ? '8px' : '10px', 
          width: '100%'
        }}>
          {data.map(([label, value], index) => {
            const safeValue = value || 0;
            const percentage = (safeValue / actualMaxValue) * 100;
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: minimal ? '80px' : '120px', 
                  fontSize: minimal ? '11px' : '12px', 
                  color: chartColors.secondary,
                  textAlign: 'right',
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  {label || ''}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    height: `${height}px`,
                    background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: color || chartColors.primary,
                      transition: 'width 0.6s ease-out',
                      position: 'relative'
                    }}>
                      {/* Subtle gradient overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>
                  <span style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: minimal ? '11px' : '12px',
                    fontWeight: '600',
                    color: chartColors.secondary,
                    marginRight: '8px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  }}>
                    {showPercentage ? `${Math.round(percentage)}%` : safeValue.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    };
    
    // Professional line chart
    const LineChart = ({ data, height = 160, color, showArea = false, showGrid = true, minimal = false }) => {
      if (!data || data.length === 0) return null;
      
      const padding = { top: 10, right: 10, bottom: 30, left: 40 };
      const chartWidth = 100;
      const chartHeight = height - padding.top - padding.bottom;
      
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const range = maxValue - minValue || 1;
      
      // Generate path
      const generatePath = (isArea = false) => {
        const points = data.map((point, i) => {
          const x = (i / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
          return { x, y };
        });
        
        let path = '';
        points.forEach((point, i) => {
          if (i === 0) {
            path += `M ${point.x}% ${point.y + padding.top}`;
          } else {
            path += ` L ${point.x}% ${point.y + padding.top}`;
          }
        });
        
        if (isArea) {
          path += ` L ${chartWidth}% ${chartHeight + padding.top} L 0% ${chartHeight + padding.top} Z`;
        }
        
        return path;
      };
      
      return (
        <div style={{ 
          position: 'relative', 
          height: `${height}px`,
          width: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          {/* Y-axis labels */}
          {!minimal && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: padding.top,
              height: chartHeight,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: chartColors.muted,
              width: '35px',
              textAlign: 'right'
            }}>
              {[maxValue, Math.round((maxValue + minValue) / 2), minValue].map((val, i) => (
                <span key={i}>{val}</span>
              ))}
            </div>
          )}
          
          {/* Chart area */}
          <svg 
            width="100%" 
            height={height} 
            style={{ 
              marginLeft: minimal ? '0' : '40px'
            }}
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {showGrid && [0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1="0%"
                y1={padding.top + chartHeight * ratio}
                x2="100%"
                y2={padding.top + chartHeight * ratio}
                stroke={theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                strokeWidth="1"
              />
            ))}
            
            {/* Area fill */}
            {showArea && (
              <path
                d={generatePath(true)}
                fill={color || chartColors.primary}
                opacity="0.05"
              />
            )}
            
            {/* Line path */}
            <path
              d={generatePath(false)}
              fill="none"
              stroke={color || chartColors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {!minimal && data.map((point, i) => {
              const x = (i / (data.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - ((point.value - minValue) / range) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={y}
                  r="3"
                  fill={theme.bg}
                  stroke={color || chartColors.primary}
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          {!minimal && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              marginLeft: '40px',
              fontSize: '10px',
              color: chartColors.muted
            }}>
              {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1)
                .map((point, i) => (
                  <span key={i}>{point.label}</span>
                ))}
            </div>
          )}
        </div>
      );
    };
    
    // Professional radial progress
    const RadialProgress = ({ value, maxValue, size = 100, color, label, minimal = false }) => {
      const percentage = Math.min(100, Math.max(0, (value / (maxValue || 1)) * 100));
      const strokeWidth = size > 80 ? 6 : 4;
      const radius = size / 2 - strokeWidth;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;
      
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: size > 80 ? '8px' : '4px'
        }}>
          <svg width={size} height={size}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              strokeWidth={strokeWidth}
            />
            
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color || chartColors.primary}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ 
                transition: 'stroke-dashoffset 0.8s ease-out'
              }}
            />
            
            {/* Center text */}
            <text
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={chartColors.secondary}
              fontSize={minimal ? "18" : "24"}
              fontWeight="600"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
              {Math.round(percentage)}%
            </text>
          </svg>
          
          {label && !minimal && (
            <span style={{
              fontSize: '12px',
              color: chartColors.secondary,
              fontWeight: '500',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              {label}
            </span>
          )}
        </div>
      );
    };
    
    // Heat map component for activity patterns
    const HeatMap = ({ data, title }) => {
      if (!data || data.length === 0) return null;
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const hours = Array.from({ length: 24 }, (_, i) => i);
      
      // Generate sample data if not provided
      const heatData = data || days.map(day => 
        hours.map(hour => ({
          day,
          hour,
          value: Math.floor(Math.random() * 10)
        }))
      ).flat();
      
      const maxValue = Math.max(...heatData.map(d => d.value));
      
      const getColor = (value) => {
        const intensity = value / maxValue;
        if (intensity === 0) return theme.surfaceHover;
        if (intensity < 0.25) return `${chartColors.primary}20`;
        if (intensity < 0.5) return `${chartColors.primary}40`;
        if (intensity < 0.75) return `${chartColors.primary}60`;
        return chartColors.primary;
      };
      
      return (
        <div style={{ width: '100%' }}>
          {title && (
            <h4 style={{
              fontSize: '11px',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '8px'
            }}>
              {title}
            </h4>
          )}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'auto repeat(24, 1fr)',
            gap: '1px',
            fontSize: '8px',
            color: theme.textMuted
          }}>
            {/* Empty corner cell */}
            <div />
            
            {/* Hour labels */}
            {hours.filter((_, i) => i % 3 === 0).map(hour => (
              <div 
                key={hour} 
                style={{ 
                  textAlign: 'center',
                  gridColumn: `span 3`,
                  fontWeight: '500'
                }}
              >
                {hour}h
              </div>
            ))}
            
            {/* Day rows */}
            {days.map(day => (
              <>
                <div key={day} style={{ 
                  paddingRight: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '500'
                }}>
                  {day}
                </div>
                {hours.map(hour => {
                  const cellData = heatData.find(d => d.day === day && d.hour === hour);
                  const value = cellData?.value || 0;
                  
                  return (
                    <div
                      key={`${day}-${hour}`}
                      style={{
                        aspectRatio: '1',
                        background: getColor(value),
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title={`${day} ${hour}:00 - ${value} items`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      );
    };

    return (
      <>
        <div style={styles.modalOverlay} onClick={handleCloseStats} />
        <div style={{ ...styles.modal, maxWidth: '900px', width: '90%' }}>
          <div style={{
            ...styles.modalHeader,
            background: theme.isDark ? '#1e293b' : '#f8fafc',
            borderBottom: `1px solid ${theme.border}`,
            padding: '20px 24px'
          }}>
            <h2 style={{
              ...styles.modalTitle,
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              letterSpacing: '-0.02em'
            }}>
              Performance Analytics
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  // Generate markdown report
                  const generateReport = () => {
                    const today = new Date().toLocaleDateString();
                    const stats = appState.stats.summary;
                    
                    let report = `# Priority Matrix Statistics Report\n\n`;
                    report += `**Generated on:** ${today}\n\n`;
                    
                    report += `## Executive Summary\n\n`;
                    report += `- **Total Items:** ${stats.totalItems} (${stats.totalNotes} notes, ${stats.totalTasks} tasks)\n`;
                    report += `- **Productivity Score:** ${stats.productivityScore}%\n`;
                    report += `- **Completion Rate:** ${stats.completionRate}%\n`;
                    report += `- **Workload Balance:** ${(stats.workloadBalance * 100).toFixed(0)}%\n\n`;
                    
                    report += `## Key Metrics\n\n`;
                    report += `### Time-Based Analysis\n`;
                    report += `- **Overdue Items:** ${stats.overdueTasks}\n`;
                    report += `- **Due Today:** ${stats.todayTasks}\n`;
                    report += `- **This Week:** ${stats.weekTasks}\n`;
                    report += `- **Unscheduled:** ${stats.unscheduledItems}\n\n`;
                    
                    report += `### Productivity Metrics\n`;
                    report += `- **Completed This Week:** ${stats.completedThisWeek}\n`;
                    report += `- **Daily Average:** ${stats.avgDailyCompletions}\n`;
                    report += `- **Recurring Items:** ${stats.recurringItems}\n`;
                    report += `- **Momentum:** ${stats.momentum}%\n`;
                    report += `- **Urgency Index:** ${stats.urgencyIndex}%\n`;
                    report += `- **Focus Score:** ${stats.focusScore}/4.0\n\n`;
                    
                    report += `### Performance Analysis\n`;
                    report += `- **Velocity Trend:** ${stats.velocityTrend}%\n`;
                    report += `- **Days to Complete:** ${stats.daysToComplete || 'N/A'}\n`;
                    report += `- **Monthly Completions:** ${stats.completedLastMonth}\n\n`;
                    
                    report += `## Quadrant Breakdown\n\n`;
                    Object.entries(appState.stats).filter(([key]) => key !== 'summary').forEach(([sectionKey, sectionStats]) => {
                      const section = config.sections[sectionKey];
                      report += `### ${section?.title || sectionKey}\n`;
                      report += `- Total: ${sectionStats.total}\n`;
                      report += `- Notes: ${sectionStats.notes}\n`;
                      report += `- Tasks: ${sectionStats.tasks}\n`;
                      report += `- Completed: ${sectionStats.completed} (${sectionStats.completionRate}%)\n`;
                      if (sectionStats.overdue > 0) {
                        report += `- Overdue: ${sectionStats.overdue}\n`;
                      }
                      if (sectionStats.recurring > 0) {
                        report += `- Recurring: ${sectionStats.recurring}\n`;
                      }
                      report += `\n`;
                    });
                    
                    report += `## Recommendations\n\n`;
                    if (stats.productivityScore >= 80) {
                      report += `- ✅ **Excellent productivity!** Keep maintaining your current workflow.\n`;
                    } else if (stats.overdueTasks > 5) {
                      report += `- ⚠️ **Attention needed:** You have ${stats.overdueTasks} overdue items. Consider reviewing and updating their due dates.\n`;
                    }
                    
                    if (stats.workloadBalance < 0.5) {
                      report += `- ⚖️ **Unbalanced workload:** Your tasks are not evenly distributed across quadrants.\n`;
                    }
                    
                    if (stats.unscheduledItems > stats.totalItems * 0.3) {
                      report += `- 📅 **Many unscheduled items:** ${Math.round((stats.unscheduledItems / stats.totalItems) * 100)}% of items lack due dates.\n`;
                    }
                    
                    return report;
                  };
                  
                  const report = generateReport();
                  
                  // Create a new note with the report
                  const fileName = `Priority Matrix Report - ${new Date().toISOString().split('T')[0]}.md`;
                  const filePath = `${fileName}`;
                  
                  // Create file using Obsidian API
                  app.vault.create(filePath, report).then(() => {
                    new Notice(`Report saved to ${filePath}`, 3000);
                  }).catch(err => {
                    console.error('Error creating report:', err);
                    new Notice('Failed to create report', 3000);
                  });
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  color: chartColors.secondary,
                  fontWeight: '500',
                  fontSize: '13px',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    background: theme.surfaceHover,
                    borderColor: chartColors.primary
                  }
                }}
                title="Export statistics as markdown report"
              >
                Export Report
              </button>
              <button
                onClick={handleCloseStats}
                style={{
                  ...styles.modalClose,
                  background: 'transparent',
                  border: 'none',
                  color: chartColors.muted,
                  fontSize: '20px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ×
              </button>
            </div>
          </div>
          
          <div style={{ 
            ...styles.modalContent, 
            padding: '28px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            {appState.stats.summary && Object.keys(appState.stats.summary).length > 0 && (
              <>
                {/* Compact Key Performance Indicators */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {/* Productivity Score */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: '6px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: chartColors.muted,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Productivity
                    </div>
                    <div style={{ 
                      fontSize: '22px',
                      fontWeight: '600',
                      color: chartColors.primary,
                      marginBottom: '2px',
                      lineHeight: '1'
                    }}>
                      {appState.stats.summary.productivityScore}%
                    </div>
                    <div style={{ 
                      fontSize: '10px',
                      color: chartColors.secondary
                    }}>
                      vs overdue
                    </div>
                  </div>
                  
                  {/* Workload Balance */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: '6px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: chartColors.muted,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Balance
                    </div>
                    <div style={{ 
                      fontSize: '22px',
                      fontWeight: '600',
                      color: chartColors.success,
                      marginBottom: '2px',
                      lineHeight: '1'
                    }}>
                      {(appState.stats.summary.workloadBalance * 100).toFixed(0)}%
                    </div>
                    <div style={{ 
                      fontSize: '10px',
                      color: chartColors.secondary,
                      color: chartColors.secondary
                    }}>
                      Quadrants
                    </div>
                  </div>
                  
                  {/* Weekly Progress */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: '6px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: chartColors.muted,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      This Week
                    </div>
                    <div style={{ 
                      fontSize: '22px',
                      fontWeight: '600',
                      color: chartColors.info,
                      marginBottom: '2px',
                      lineHeight: '1'
                    }}>
                      {appState.stats.summary.completedThisWeek}
                    </div>
                    <div style={{ 
                      fontSize: '10px',
                      color: chartColors.secondary
                    }}>
                      {appState.stats.summary.avgDailyCompletions}/day
                    </div>
                  </div>
                  
                  {/* Urgency Compact Card */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: '6px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: chartColors.muted,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Urgency
                    </div>
                    <div style={{ 
                      fontSize: '22px',
                      fontWeight: '600',
                      color: chartColors.warning,
                      marginBottom: '2px',
                      lineHeight: '1'
                    }}>
                      {appState.stats.summary.urgencyIndex}%
                    </div>
                    <div style={{ 
                      fontSize: '10px',
                      color: chartColors.secondary
                    }}>
                      urgent items
                    </div>
                  </div>
                </div>
                
                {/* Main Stats Section - Compact */}
                <div style={{
                  padding: '12px',
                  background: theme.surface,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    margin: '0 0 8px 0',
                    color: chartColors.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Overview
                  </h3>

                  {/* Main Stats Grid - Compact */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '6px'
                  }}>
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'center',
                      border: `1px solid ${theme.border}`,
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: chartColors.primary,
                        marginBottom: '2px'
                      }}>
                        {appState.stats.summary.totalItems}
                      </div>
                      <div style={{ 
                        fontSize: '10px',
                        color: chartColors.secondary,
                        fontWeight: '500'
                      }}>
                        Total
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: chartColors.muted,
                        marginTop: '2px'
                      }}>
                        {appState.stats.summary.totalNotes}n · {appState.stats.summary.totalTasks}t
                      </div>
                    </div>
                  
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'center',
                      border: `1px solid ${theme.border}`,
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: chartColors.success,
                        marginBottom: '2px'
                      }}>
                        {appState.stats.summary.completionRate}%
                      </div>
                      <div style={{ 
                        fontSize: '10px',
                        color: chartColors.secondary,
                        fontWeight: '500'
                      }}>
                        Complete
                      </div>
                    </div>
                    
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'center',
                      border: `1px solid ${theme.border}`,
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: chartColors.warning,
                        marginBottom: '2px'
                      }}>
                        {appState.stats.summary.todayTasks}
                      </div>
                      <div style={{ 
                        fontSize: '10px',
                        color: chartColors.secondary,
                        fontWeight: '500'
                      }}>
                        Today
                      </div>
                    </div>
                    
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'center',
                      border: `1px solid ${theme.border}`,
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: chartColors.danger,
                        marginBottom: '2px'
                      }}>
                        {appState.stats.summary.overdueTasks}
                      </div>
                      <div style={{ 
                        fontSize: '10px',
                        color: chartColors.secondary,
                        fontWeight: '500'
                      }}>
                        Overdue
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Task Distribution Chart - Compact */}
                <div style={{
                  padding: '12px',
                  background: theme.surface,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Task Distribution
                  </h3>
                  
                  {appState.stats.summary.quadrantBalance && (
                    <BarChart
                      data={Object.entries(appState.stats.summary.quadrantBalance).map(([key, value]) => [
                        config.sections[key]?.title.replace(/[^ -]/g, '').trim() || key,
                        value
                      ])}
                      maxValue={Math.max(...Object.values(appState.stats.summary.quadrantBalance))}
                      color={theme.accent}
                    />
                  )}
                </div>
                
                {/* Advanced Metrics Grid - Compact */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {/* Momentum Indicator - Compact */}
                  <div style={{
                    background: theme.surface,
                    borderRadius: '6px',
                    padding: '8px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <h4 style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: theme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      Momentum
                    </h4>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: appState.stats.summary.momentum > 0 ? chartColors.success : chartColors.danger,
                      marginBottom: '2px'
                    }}>
                      {appState.stats.summary.momentum > 0 ? '+' : ''}{appState.stats.summary.momentum}%
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: theme.textMuted
                    }}>
                      vs monthly
                    </div>
                  </div>

                  {/* Urgency Index - Compact */}
                  <div style={{
                    background: theme.surface,
                    borderRadius: '6px',
                    padding: '8px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <h4 style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: theme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      Urgency
                    </h4>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: chartColors.warning,
                      marginBottom: '2px'
                    }}>
                      {appState.stats.summary.urgencyIndex}%
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: theme.textMuted
                    }}>
                      urgent+overdue
                    </div>
                  </div>

                  {/* Focus Score - Compact */}
                  <div style={{
                    background: theme.surface,
                    borderRadius: '6px',
                    padding: '8px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative'
                  }}>
                    <h4 style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: theme.textSecondary,
                      marginBottom: '4px'
                    }}>
                      Focus
                    </h4>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: chartColors.purple,
                      marginBottom: '2px'
                    }}>
                      {appState.stats.summary.focusScore}/4
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: theme.textMuted
                    }}>
                      priority dist
                    </div>
                  </div>
                </div>
                
                {/* Time Analytics - Compact */}
                <div style={{
                  padding: '12px',
                  background: theme.surface,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: theme.text
                  }}>
                    Time Analytics
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '6px'
                  }}>
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: theme.error,
                        marginBottom: '4px'
                      }}>
                        Overdue
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: theme.error }}>
                        {appState.stats.summary.overdueTasks}
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>
                        {Math.round((appState.stats.summary.overdueTasks / Math.max(appState.stats.summary.totalItems, 1)) * 100)}% total
                      </div>
                    </div>
                    
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: theme.warning,
                        marginBottom: '4px'
                      }}>
                        Today
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: theme.warning }}>
                        {appState.stats.summary.todayTasks}
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>
                        Attention
                      </div>
                    </div>
                    
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: theme.accent,
                        marginBottom: '4px'
                      }}>
                        Week
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: theme.accent }}>
                        {appState.stats.summary.weekTasks}
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>
                        Scheduled
                      </div>
                    </div>
                    
                    <div style={{
                      background: theme.bg,
                      borderRadius: '4px',
                      padding: '8px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: theme.textSecondary,
                        marginBottom: '4px'
                      }}>
                        No Date
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textSecondary }}>
                        {appState.stats.summary.unscheduledItems}
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>
                        Unscheduled
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Stats - Compact */}
                <div style={{
                  padding: '12px',
                  background: theme.surface,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: theme.text
                  }}>
                    Quadrant Breakdown
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(appState.stats).filter(([key]) => key !== 'summary').map(([sectionKey, sectionStats]) => {
                      const section = config.sections[sectionKey];
                      const totalItems = sectionStats.total || 1; // Prevent division by zero
                      const completedPercentage = Math.round((sectionStats.completed / totalItems) * 100);
                      
                      return (
                        <div key={sectionKey} style={{
                          background: theme.bg,
                          borderRadius: '4px',
                          padding: '8px',
                          border: `1px solid ${theme.border}`,
                          position: 'relative'
                        }}>
                          {/* Color indicator */}
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            background: section?.color || theme.accent,
                            borderRadius: '4px 0 0 4px'
                          }} />
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '6px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ 
                                fontSize: '11px',
                                fontWeight: '600',
                                color: theme.text,
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {section?.title || 'Unknown'}
                                <span style={{
                                  fontSize: '9px',
                                  padding: '1px 4px',
                                  background: `${section?.color || theme.accent}15`,
                                  color: section?.color || theme.accent,
                                  borderRadius: '8px',
                                  fontWeight: '500'
                                }}>
                                  {sectionStats.total}
                                </span>
                                {sectionStats.overdue > 0 && (
                                  <span style={{
                                    fontSize: '9px',
                                    padding: '1px 4px',
                                    background: `${theme.error}20`,
                                    color: theme.error,
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                  }}>
                                    {sectionStats.overdue}!
                                  </span>
                                )}
                              </h4>
                            </div>
                            
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: section?.color || theme.accent
                            }}>
                              {completedPercentage}%
                            </div>
                          </div>
                          
                          {/* Progress bar - Thinner */}
                          <div style={{
                            height: '3px',
                            background: theme.surfaceHover,
                            borderRadius: '2px',
                            marginBottom: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${completedPercentage}%`,
                              background: section?.color || theme.accent,
                              borderRadius: '2px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          
                          {/* Stats breakdown - Compact */}
                          <div style={{ 
                            display: 'flex',
                            gap: '8px',
                            fontSize: '9px',
                            color: theme.textSecondary
                          }}>
                            <span>{sectionStats.notes}n</span>
                            <span>·</span>
                            <span>{sectionStats.tasks}t</span>
                            <span>·</span>
                            <span style={{ fontWeight: '500' }}>{sectionStats.completed}✓</span>
                            {sectionStats.recurring > 0 && (
                              <>
                                <span>·</span>
                                <span>{sectionStats.recurring}r</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Insights & Recommendations - Compact */}
                <div style={{
                  padding: '12px',
                  background: theme.surface,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: theme.text
                  }}>
                    Insights
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Productivity Insight - Compact */}
                    {appState.stats.summary.productivityScore >= 80 ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px',
                        background: theme.bg,
                        borderRadius: '4px',
                        border: `1px solid ${theme.success}30`,
                        fontSize: '10px'
                      }}>
                        <span style={{ color: theme.success, fontWeight: '600' }}>✓</span>
                        <span>
                          <span style={{ fontWeight: '600', color: theme.success }}>Excellent!</span>
                          {' '}{appState.stats.summary.productivityScore}% productivity
                        </span>
                      </div>
                    ) : appState.stats.summary.overdueTasks > 5 ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px',
                        background: theme.bg,
                        borderRadius: '4px',
                        border: `1px solid ${theme.error}30`,
                        fontSize: '10px'
                      }}>
                        <span style={{ color: theme.error, fontWeight: '600' }}>!</span>
                        <span>
                          <span style={{ fontWeight: '600', color: theme.error }}>Attention:</span>
                          {' '}{appState.stats.summary.overdueTasks} overdue items
                        </span>
                      </div>
                    ) : null}
                    
                    {/* Workload Balance Insight - Compact */}
                    {appState.stats.summary.workloadBalance < 0.5 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px',
                        background: theme.bg,
                        borderRadius: '4px',
                        border: `1px solid ${theme.warning}30`,
                        fontSize: '10px'
                      }}>
                        <span style={{ color: theme.warning, fontWeight: '600' }}>⚖</span>
                        <span>
                          <span style={{ fontWeight: '600', color: theme.warning }}>Unbalanced:</span>
                          {' '}Redistribute tasks across quadrants
                        </span>
                      </div>
                    )}
                    
                    {/* Unscheduled Items Insight - Compact */}
                    {appState.stats.summary.unscheduledItems > appState.stats.summary.totalItems * 0.3 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px',
                        background: theme.bg,
                        borderRadius: '4px',
                        border: `1px solid ${theme.accent}30`,
                        fontSize: '10px'
                      }}>
                        <span style={{ color: theme.accent, fontWeight: '600' }}>i</span>
                        <span>
                          <span style={{ fontWeight: '600', color: theme.accent }}>Schedule:</span>
                          {' '}{Math.round((appState.stats.summary.unscheduledItems / appState.stats.summary.totalItems) * 100)}% items need dates
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Time-Based Analytics */}
                {appState.stats.summary.tasksByDate && appState.stats.summary.tasksByDate.length > 0 && (
                  <div style={{
                    padding: '20px',
                    background: theme.surface,
                    borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                    border: `1px solid ${theme.border}`,
                    marginTop: '20px'
                  }}>
                    <h3 style={{ 
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 20px 0',
                      color: theme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>📈</span> Task Timeline & Trends
                    </h3>
                    
                    {/* Weekly Activity */}
                    <div style={{
                      marginBottom: '32px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: chartColors.secondary,
                        marginBottom: '16px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                      }}>
                        Weekly Task Distribution
                      </h4>
                      {(() => {
                        const last7Days = Array.from({ length: 7 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (6 - i));
                          return date.toISOString().split('T')[0];
                        });
                        
                        const weekData = last7Days.map(date => {
                          const tasksOnDate = appState.stats.summary.tasksByDate.find(([d]) => d === date)?.[1] || 0;
                          return {
                            label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
                            value: tasksOnDate,
                            date: date
                          };
                        });
                        
                        const maxValue = Math.max(...weekData.map(d => d.value), 1);
                        
                        // Column chart visualization
                        return (
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '8px',
                            height: '120px',
                            paddingBottom: '20px',
                            position: 'relative'
                          }}>
                            {weekData.map((day, index) => {
                              const heightPercentage = (day.value / maxValue) * 100;
                              const isToday = new Date().toDateString() === new Date(day.date).toDateString();
                              
                              return (
                                <div
                                  key={index}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    position: 'relative'
                                  }}
                                >
                                  {/* Value label */}
                                  <div style={{
                                    position: 'absolute',
                                    top: `-${heightPercentage}%`,
                                    transform: 'translateY(-100%)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: isToday ? chartColors.primary : chartColors.secondary,
                                    marginBottom: '4px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                  }}>
                                    {day.value}
                                  </div>
                                  
                                  {/* Column */}
                                  <div
                                    style={{
                                      width: '100%',
                                      maxWidth: '40px',
                                      height: `${heightPercentage}%`,
                                      background: isToday ? chartColors.primary : chartColors.secondary,
                                      borderRadius: '4px 4px 0 0',
                                      opacity: isToday ? 1 : 0.6,
                                      transition: 'all 0.3s ease',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      bottom: 0
                                    }}
                                    title={`${day.label}: ${day.value} tasks`}
                                  />
                                  
                                  {/* Day label */}
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-20px',
                                    fontSize: '11px',
                                    color: chartColors.muted,
                                    fontWeight: isToday ? '600' : '400',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                  }}>
                                    {day.label}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Completion Metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: COMMON_CONSTANTS.SPACING.lg,
                      marginTop: '24px'
                    }}>
                      <RadialProgress
                        value={appState.stats.summary.completedTasks}
                        maxValue={appState.stats.summary.totalTasks || 1}
                        size={100}
                        color={theme.success}
                        label="Overall Progress"
                      />
                      
                      <RadialProgress
                        value={appState.stats.summary.totalItems - appState.stats.summary.unscheduledItems}
                        maxValue={appState.stats.summary.totalItems || 1}
                        size={100}
                        color={theme.warning}
                        label="Scheduled Items"
                      />
                      
                      <RadialProgress
                        value={appState.stats.summary.totalItems - appState.stats.summary.overdueTasks}
                        maxValue={appState.stats.summary.totalItems || 1}
                        size={100}
                        color={theme.error}
                        label="On Track"
                      />
                    </div>
                  </div>
                )}
                
                {/* Activity Heat Map */}
                {appState.stats.summary.activityHeatMap && appState.stats.summary.activityHeatMap.length > 0 && (
                  <div style={{
                    padding: '20px',
                    background: theme.surface,
                    borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                    border: `1px solid ${theme.border}`,
                    marginTop: '20px'
                  }}>
                    <h3 style={{ 
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 20px 0',
                      color: theme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🔥</span> Activity Patterns
                    </h3>
                    
                    <HeatMap 
                      data={appState.stats.summary.activityHeatMap.map(([key, value]) => {
                        const [day, hour] = key.split('-');
                        return { day, hour: parseInt(hour), value };
                      })}
                      title="Task Creation by Day & Hour"
                    />
                    
                    {/* Weekly Pattern Chart */}
                    <div style={{ marginTop: '32px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '16px'
                      }}>
                        Weekly Activity Pattern
                      </h4>
                      <BarChart
                        data={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => [
                          day,
                          appState.stats.summary.weeklyPattern?.[i] || 0
                        ])}
                        color={chartColors.purple}
                        height={24}
                      />
                    </div>
                  </div>
                )}
                
                {/* Trend Analysis & Predictions */}
                <div style={{
                  padding: '20px',
                  background: `linear-gradient(135deg, ${chartColors.info}05, ${theme.surface})`,
                  borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                  border: `1px solid ${chartColors.info}20`,
                  marginTop: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>🔮</span> Predictions & Insights
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: COMMON_CONSTANTS.SPACING.lg
                  }}>
                    {/* Completion Estimate */}
                    {appState.stats.summary.daysToComplete && (
                      <div style={{
                        background: theme.bg,
                        borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                        padding: '16px',
                        border: `1px solid ${theme.border}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', marginBottom: '8px' }}>📅</div>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: chartColors.info,
                          marginBottom: '4px'
                        }}>
                          {appState.stats.summary.daysToComplete} days
                        </div>
                        <div style={{
                          fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
                          color: theme.textMuted
                        }}>
                          to complete all tasks
                        </div>
                      </div>
                    )}
                    
                    {/* Velocity Trend */}
                    <div style={{
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                      padding: '16px',
                      border: `1px solid ${theme.border}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚀</div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: appState.stats.summary.velocityTrend > 0 ? chartColors.success : chartColors.danger,
                        marginBottom: '4px'
                      }}>
                        {appState.stats.summary.velocityTrend > 0 ? '+' : ''}{appState.stats.summary.velocityTrend}%
                      </div>
                      <div style={{
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
                        color: theme.textMuted
                      }}>
                        velocity change
                      </div>
                    </div>
                    
                    {/* Best Performance Day */}
                    <div style={{
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                      padding: '16px',
                      border: `1px solid ${theme.border}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>⭐</div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: chartColors.warning,
                        marginBottom: '4px'
                      }}>
                        {(() => {
                          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          const maxIndex = appState.stats.summary.weeklyPattern?.reduce((maxIdx, val, idx, arr) => 
                            val > arr[maxIdx] ? idx : maxIdx, 0) || 0;
                          return days[maxIndex];
                        })()}
                      </div>
                      <div style={{
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
                        color: theme.textMuted
                      }}>
                        most productive day
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Overview */}
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: chartColors.secondary,
                      marginBottom: '16px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}>
                      30-Day Activity Overview
                    </h4>
                    {(() => {
                      // Generate data for the last 30 days grouped by week
                      const weeks = [];
                      for (let w = 0; w < 4; w++) {
                        const weekStart = new Date();
                        weekStart.setDate(weekStart.getDate() - (3 - w) * 7 - 6);
                        const weekEnd = new Date();
                        weekEnd.setDate(weekEnd.getDate() - (3 - w) * 7);
                        
                        let weekTotal = 0;
                        for (let d = 0; d < 7; d++) {
                          const date = new Date(weekStart);
                          date.setDate(date.getDate() + d);
                          const dateStr = date.toISOString().split('T')[0];
                          const dayValue = appState.stats.summary.tasksByDate?.find(([d]) => d === dateStr)?.[1] || 0;
                          weekTotal += dayValue;
                        }
                        
                        weeks.push({
                          label: w === 3 ? 'This Week' : `Week ${w + 1}`,
                          value: weekTotal,
                          avg: (weekTotal / 7).toFixed(1)
                        });
                      }
                      
                      const maxWeekValue = Math.max(...weeks.map(w => w.value), 1);
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {weeks.map((week, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '80px',
                                fontSize: '12px',
                                color: chartColors.secondary,
                                fontWeight: '500',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                              }}>
                                {week.label}
                              </div>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <div style={{
                                  height: '32px',
                                  background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${(week.value / maxWeekValue) * 100}%`,
                                    background: index === 3 ? chartColors.primary : chartColors.secondary,
                                    opacity: index === 3 ? 1 : 0.7,
                                    transition: 'width 0.6s ease-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '12px'
                                  }}>
                                    <span style={{
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      color: 'white',
                                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                    }}>
                                      {week.value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: chartColors.muted,
                                minWidth: '60px',
                                textAlign: 'right',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                              }}>
                                {week.avg}/day
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Productivity Trends */}
                <div style={{
                  padding: '20px',
                  background: `linear-gradient(135deg, ${theme.success}05, ${theme.surface})`,
                  borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                  border: `1px solid ${theme.success}20`,
                  marginTop: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>🎯</span> Productivity Insights
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: COMMON_CONSTANTS.SPACING.xl
                  }}>
                    {/* Velocity Metrics */}
                    <div style={{
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                      padding: '16px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '16px' }}>🚀</span> Velocity
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.small, color: theme.textSecondary }}>
                            Daily Average
                          </span>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: theme.accent }}>
                            {appState.stats.summary.avgDailyCompletions}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.small, color: theme.textSecondary }}>
                            Weekly Total
                          </span>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: theme.success }}>
                            {appState.stats.summary.completedThisWeek}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Focus Areas */}
                    <div style={{
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                      padding: '16px',
                      border: `1px solid ${theme.border}`
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '16px' }}>🎯</span> Focus Areas
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.small
                      }}>
                        {Object.entries(appState.stats.summary.quadrantBalance)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div key={key} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 8px',
                              background: `${config.sections[key]?.color || theme.accent}10`,
                              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small
                            }}>
                              <span style={{ color: theme.text, fontWeight: '500' }}>
                                {config.sections[key]?.title || key}
                              </span>
                              <span style={{ 
                                color: config.sections[key]?.color || theme.accent,
                                fontWeight: '600'
                              }}>
                                {value} items
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Summary */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: theme.bg,
                    borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                    border: `1px solid ${theme.border}`,
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: COMMON_CONSTANTS.SPACING.md,
                      marginBottom: '12px'
                    }}>
                      {[
                        { label: 'Efficiency', value: `${appState.stats.summary.productivityScore}%`, icon: '⚡' },
                        { label: 'Balance', value: `${(appState.stats.summary.workloadBalance * 100).toFixed(0)}%`, icon: '⚖️' },
                        { label: 'Completion', value: `${appState.stats.summary.completionRate}%`, icon: '✅' },
                        { label: 'Scheduled', value: `${Math.round(((appState.stats.summary.totalItems - appState.stats.summary.unscheduledItems) / appState.stats.summary.totalItems) * 100)}%`, icon: '📅' }
                      ].map((metric, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ fontSize: '20px' }}>{metric.icon}</span>
                          <span style={{ 
                            fontSize: '20px', 
                            fontWeight: '700',
                            color: theme.accent
                          }}>
                            {metric.value}
                          </span>
                          <span style={{ 
                            fontSize: COMMON_CONSTANTS.FONT_SIZES.small,
                            color: theme.textSecondary
                          }}>
                            {metric.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Performance message */}
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: `${theme.accent}10`,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
                      color: theme.text
                    }}>
                      {appState.stats.summary.productivityScore >= 90 ? (
                        <span>🌟 Outstanding performance! You're in the top tier of productivity.</span>
                      ) : appState.stats.summary.productivityScore >= 75 ? (
                        <span>💪 Great job! You're maintaining strong productivity levels.</span>
                      ) : appState.stats.summary.productivityScore >= 60 ? (
                        <span>📈 Good progress! Focus on clearing overdue items to boost your score.</span>
                      ) : (
                        <span>🎯 Room for improvement. Start with your most urgent tasks first.</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderSettingsPopup() {
    if (!config.ui.showSettings) return null;

    return (
      <>
        <div style={styles.modalOverlay} onClick={handleCloseSettings} />
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Settings</h2>
            <button
              onClick={handleCloseSettings}
              style={styles.modalClose}
            >
              ✕
            </button>
          </div>
          
          <div style={styles.modalContent}>
            <div style={styles.tabsContainer}>
              {[
                { id: "sections", label: "Quadrants", icon: COMMON_CONSTANTS.ICONS.target },
                { id: "scheduling", label: "Scheduling", icon: COMMON_CONSTANTS.ICONS.calendar },
                { id: "display", label: "Display", icon: "🎨" },
                { id: "advanced", label: "Advanced", icon: "⚙️" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUiState(prev => ({ ...prev, activeSettingsTab: tab.id }))}
                  style={{
                    ...styles.tabButton,
                    ...(uiState.activeSettingsTab === tab.id ? styles.tabButtonActive : {})
                  }}
                  aria-selected={uiState.activeSettingsTab === tab.id}
                  role="tab"
                >
                  <span style={{ marginRight: COMMON_CONSTANTS.SPACING.xs }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sections Tab */}
            {uiState.activeSettingsTab === "sections" && (
              <div style={{ padding: '28px' }}>
                {Object.entries(config.sections).map(([sectionKey, section], index) => (
                  <div key={sectionKey} style={{ 
                    marginBottom: COMMON_CONSTANTS.SPACING.xl,
                    padding: '20px',
                    background: theme.surface,
                    borderRadius: '10px',
                    border: `1px solid ${theme.border}`,
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Delete button */}
                    {Object.keys(config.sections).length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the "${section.title}" quadrant?`)) {
                            const newSections = { ...config.sections };
                            delete newSections[sectionKey];
                            updateConfig('sections', newSections);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: theme.error,
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
                          fontSize: '18px',
                          opacity: 0.6,
                          transition: COMMON_CONSTANTS.TRANSITIONS.fast
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                        title="Delete quadrant"
                        aria-label={`Delete ${section.title} quadrant`}
                      >
                        {COMMON_CONSTANTS.ICONS.error}
                      </button>
                    )}
                    
                    {/* Quadrant Header with Color Indicator */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: `1px solid ${theme.border}`
                    }}>
                      <div style={{
                        width: '4px',
                        height: '40px',
                        background: section.color,
                        borderRadius: '2px',
                        marginRight: '16px'
                      }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          margin: 0,
                          color: theme.text,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {section.title}
                          <span style={{
                            fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
                            padding: '4px 8px',
                            background: `${section.color}20`,
                            color: section.color,
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            Row {section.position.row}, Col {section.position.col}
                          </span>
                        </h3>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal }}>Quadrant Title</label>
                        <input
                          value={section.title}
                          onChange={(e) => updateConfig(`sections.${sectionKey}.title`, e.target.value)}
                          style={styles.input}
                          placeholder="e.g., 🔥 Do First"
                        />
                        <div style={styles.helpText}>
                          The name displayed for this quadrant
                        </div>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal }}>Subtitle</label>
                        <input
                          value={section.subtitle}
                          onChange={(e) => updateConfig(`sections.${sectionKey}.subtitle`, e.target.value)}
                          style={styles.input}
                          placeholder="e.g., Urgent & Important"
                        />
                        <div style={styles.helpText}>
                          Brief categorization shown below the title
                        </div>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal }}>Description</label>
                        <textarea
                          value={section.description}
                          onChange={(e) => updateConfig(`sections.${sectionKey}.description`, e.target.value)}
                          style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                          placeholder="e.g., Crisis situations, urgent problems, deadline-driven projects"
                        />
                        <div style={styles.helpText}>
                          Detailed description (shown when descriptions are enabled)
                        </div>
                      </div>
                    </div>
                    
                    {/* Rules and Appearance Section */}
                    <div style={{ 
                      background: theme.bg,
                      padding: '16px',
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      marginTop: '20px'
                    }}>
                      <h4 style={{ 
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.large, 
                        fontWeight: '600', 
                        margin: '0 0 16px 0',
                        color: theme.text
                      }}>
                        Rules & Appearance
                      </h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Property Name</label>
                          <input
                            value={section.propertyRules.propertyName}
                            onChange={(e) => updateConfig(`sections.${sectionKey}.propertyRules.propertyName`, e.target.value)}
                            style={{
                              ...styles.input,
                              background: theme.surface,
                              borderColor: theme.borderHover
                            }}
                          />
                          <div style={styles.helpText}>
                            Frontmatter property to check
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Property Value</label>
                          <input
                            value={section.propertyRules.propertyValue}
                            onChange={(e) => updateConfig(`sections.${sectionKey}.propertyRules.propertyValue`, e.target.value)}
                            style={{
                              ...styles.input,
                              background: theme.surface,
                              borderColor: theme.borderHover
                            }}
                          />
                          <div style={styles.helpText}>
                            Value to match
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Task Tag</label>
                          <input
                            value={section.taskRules.tagName}
                            onChange={(e) => updateConfig(`sections.${sectionKey}.taskRules.tagName`, e.target.value)}
                            style={{
                              ...styles.input,
                              background: theme.surface,
                              borderColor: theme.borderHover
                            }}
                          />
                          <div style={styles.helpText}>
                            Tag to match in tasks
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Quadrant Color</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              value={section.color}
                              onChange={(e) => updateConfig(`sections.${sectionKey}.color`, e.target.value)}
                              style={{
                                ...styles.input,
                                width: '80px',
                                height: '36px',
                                padding: '4px',
                                cursor: 'pointer'
                              }}
                              type="color"
                            />
                            <input
                              value={section.color}
                              onChange={(e) => updateConfig(`sections.${sectionKey}.color`, e.target.value)}
                              style={{
                                ...styles.input,
                                flex: 1,
                                background: theme.surface,
                                borderColor: theme.borderHover
                              }}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                      
                    {/* Position Section */}
                    <div style={{ 
                      background: theme.bg,
                      padding: '16px',
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      marginTop: '16px'
                    }}>
                      <h4 style={{ 
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.large, 
                        fontWeight: '600', 
                        margin: '0 0 16px 0',
                        color: theme.text
                      }}>
                        Grid Position
                      </h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Row</label>
                          <input
                            value={section.position.row}
                            onChange={(e) => updateQuadrantPosition(sectionKey, e.target.value, section.position.col)}
                            style={{
                              ...styles.input,
                              background: theme.surface,
                              borderColor: theme.borderHover
                            }}
                            type="number"
                            min="0"
                          />
                          <div style={styles.helpText}>
                            Row number (0 = first row)
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.normal, fontWeight: '600' }}>Column</label>
                          <input
                            value={section.position.col}
                            onChange={(e) => updateQuadrantPosition(sectionKey, section.position.row, e.target.value)}
                            style={{
                              ...styles.input,
                              background: theme.surface,
                              borderColor: theme.borderHover
                            }}
                            type="number"
                            min="0"
                          />
                          <div style={styles.helpText}>
                            Column number (0 = first column)
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ 
                      marginTop: "20px", 
                      paddingTop: "20px", 
                      borderTop: `1px solid ${theme.border}`,
                      display: "flex", 
                      justifyContent: "flex-end" 
                    }}>
                      <button
                        onClick={() => removeQuadrant(sectionKey)}
                        style={{
                          background: 'transparent',
                          color: theme.error,
                          border: `1px solid ${theme.error}`,
                          padding: '8px 20px',
                          borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                          fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: COMMON_CONSTANTS.TRANSITIONS.fast
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = theme.error;
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = theme.error;
                        }}
                      >
                        Remove Quadrant
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Grid Layout Preview */}
                <div style={{ 
                  marginTop: '24px', 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, ' + theme.accent + '10 0%, ' + theme.surface + ' 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 16px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>🎯</span> Grid Layout Preview
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: COMMON_CONSTANTS.SPACING.sm,
                    padding: '12px',
                    background: theme.bg,
                    borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                    border: `1px solid ${theme.border}`
                  }}>
                    {(() => {
                      const previewRows = {};
                      Object.entries(config.sections).forEach(([key, section]) => {
                        const row = section.position.row;
                        if (!previewRows[row]) previewRows[row] = [];
                        previewRows[row].push({ key, section });
                      });
                      
                      const sortedPreviewRows = Object.keys(previewRows)
                        .map(Number)
                        .sort((a, b) => a - b);
                      
                      return sortedPreviewRows.map(rowNum => {
                        const sectionsInRow = previewRows[rowNum];
                        const maxCol = sectionsInRow.length > 0 
                          ? Math.max(...sectionsInRow.map(s => s.section.position.col || 0))
                          : 0;
                        
                        return (
                          <div key={rowNum} style={{ display: 'flex', gap: '8px' }}>
                            {Array.from({ length: maxCol + 1 }).map((_, colIndex) => {
                              const section = sectionsInRow.find(s => s.section.position.col === colIndex);
                              return (
                                <div
                                  key={colIndex}
                                  style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: section ? section.section.color + '20' : theme.surface,
                                    color: section ? section.section.color : theme.textMuted,
                                    borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.medium,
                                    fontSize: COMMON_CONSTANTS.FONT_SIZES.medium,
                                    fontWeight: section ? '600' : '400',
                                    textAlign: 'center',
                                    minHeight: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: section ? `2px solid ${section.section.color}` : `2px dashed ${theme.border}`,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {section ? section.section.title : 'Empty'}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div style={{ ...styles.helpText, marginTop: '8px' }}>
                    This preview shows how your quadrants will be arranged. Use row/column positions to control the layout.
                  </div>
                </div>
                
                {/* Add New Quadrant Section */}
                <div style={{ 
                  marginTop: '32px', 
                  padding: '24px', 
                  background: theme.surface,
                  borderRadius: '12px',
                  border: `2px dashed ${theme.accent}40`,
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 16px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>➕</span> Add New Quadrant
                  </h3>
                  <div style={{ display: "flex", gap: "12px", maxWidth: '400px', margin: '0 auto' }}>
                    <input
                      value={uiState.newQuadrantName}
                      onChange={(e) => setUiState(prev => ({ ...prev, newQuadrantName: e.target.value }))}
                      placeholder="Enter quadrant name..."
                      style={{ 
                        ...styles.input, 
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '14px'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addQuadrant(uiState.newQuadrantName);
                        }
                      }}
                    />
                    <button
                      onClick={() => addQuadrant(uiState.newQuadrantName)}
                      style={{
                        padding: '12px 28px',
                        background: theme.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: COMMON_CONSTANTS.TRANSITIONS.fast,
                        boxShadow: `0 2px 8px ${theme.accent}40`
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.accentHover;
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = `0 4px 12px ${theme.accent}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = theme.accent;
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = `0 2px 8px ${theme.accent}40`;
                      }}
                    >
                      Add Quadrant
                    </button>
                  </div>
                  <div style={{ ...styles.helpText, marginTop: '12px', fontSize: COMMON_CONSTANTS.FONT_SIZES.medium }}>
                    Create a new quadrant to organize your tasks and notes with custom rules
                  </div>
                </div>
              </div>
            )}

            {/* Scheduling Tab */}
            {uiState.activeSettingsTab === "scheduling" && (
              <div style={{ padding: '28px' }}>
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>📅</span> Date Configuration
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, fontWeight: '600' }}>Date Property Name</label>
                      <input
                        value={config.scheduling.datePropertyName}
                        onChange={(e) => updateConfig("scheduling.datePropertyName", e.target.value)}
                        style={{
                          ...styles.input,
                          padding: '10px 14px',
                          fontSize: '14px'
                        }}
                        placeholder="due_date"
                      />
                      <div style={{ ...styles.helpText, marginTop: '8px', lineHeight: '1.6' }}>
                        <div><strong>Frontmatter property for dates</strong></div>
                        <div style={{ marginTop: '4px' }}>Supported formats: 2024-12-25, 12/25/2024, 25/12/2024</div>
                        <div>For tasks: Add dates anywhere in task text</div>
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, fontWeight: '600' }}>Recurring Property Name</label>
                      <input
                        value={config.scheduling.recurringPropertyName}
                        onChange={(e) => updateConfig("scheduling.recurringPropertyName", e.target.value)}
                        style={{
                          ...styles.input,
                          padding: '10px 14px',
                          fontSize: '14px'
                        }}
                        placeholder="recurring"
                      />
                      <div style={{ ...styles.helpText, marginTop: '8px', lineHeight: '1.6' }}>
                        <div><strong>Frontmatter property for recurring patterns</strong></div>
                        <div style={{ marginTop: '4px' }}>• Frequencies: daily, weekly, monthly, yearly</div>
                        <div>• Specific days: monday, tuesday, etc.</div>
                        <div>• Day groups: weekdays, weekends</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 16px 0',
                    color: theme.text
                  }}>
                    Feature Settings
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.scheduling.enableScheduling}
                        onChange={(e) => updateConfig("scheduling.enableScheduling", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Date Scheduling</span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.scheduling.enableRecurring}
                        onChange={(e) => updateConfig("scheduling.enableRecurring", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Recurring Items</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {uiState.activeSettingsTab === "display" && (
              <div style={{ padding: '28px' }}>
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>👁️</span> Visibility Settings
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.display.showNotes}
                        onChange={(e) => updateConfig("display.showNotes", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Notes</span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.display.showTasks}
                        onChange={(e) => updateConfig("display.showTasks", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Tasks</span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.display.showCompleted}
                        onChange={(e) => updateConfig("display.showCompleted", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Completed Tasks</span>
                    </label>
                    
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.bg,
                      borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                      cursor: 'pointer',
                      transition: COMMON_CONSTANTS.TRANSITIONS.fast
                    }}>
                      <input
                        type="checkbox"
                        checked={config.display.showDescriptions}
                        onChange={(e) => updateConfig("display.showDescriptions", e.target.checked)}
                        style={{ 
                          ...styles.checkbox,
                          width: '18px',
                          height: '18px',
                          marginRight: '12px'
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Section Descriptions</span>
                    </label>
                  </div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span> Display Options
                  </h3>
                  
                  <div>
                    <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Max Items Per Section
                    </label>
                    <input
                      value={config.display.maxItemsPerSection}
                      onChange={(e) => updateConfig("display.maxItemsPerSection", parseInt(e.target.value) || 0)}
                      style={{
                        ...styles.input,
                        padding: '10px 14px',
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
                        width: '150px'
                      }}
                      type="number"
                      min="0"
                    />
                    <div style={{ ...styles.helpText, marginTop: '8px' }}>
                      Set to 0 for unlimited items
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {uiState.activeSettingsTab === "advanced" && (
              <div style={{ padding: '28px' }}>
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>🎨</span> Customization
                  </h3>
                  
                  <div>
                    <label style={{ ...styles.label, fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Matrix Title
                    </label>
                    <input
                      value={config.ui.title}
                      onChange={(e) => updateConfig("ui.title", e.target.value)}
                      style={{
                        ...styles.input,
                        padding: '10px 14px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter matrix title"
                    />
                  </div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: theme.surface,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: '20px'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 20px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>📁</span> Excluded Folders
                  </h3>
                  
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input
                      value={uiState.newExcludedFolder}
                      onChange={(e) => setUiState(prev => ({ ...prev, newExcludedFolder: e.target.value }))}
                      placeholder="Folder path to exclude"
                      style={{ 
                        ...styles.input, 
                        flex: 1,
                        padding: '10px 14px',
                        fontSize: '14px'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (uiState.newExcludedFolder && !config.excludedFolders.includes(uiState.newExcludedFolder)) {
                            updateConfig('excludedFolders', [...config.excludedFolders, uiState.newExcludedFolder]);
                            setUiState(prev => ({ ...prev, newExcludedFolder: '' }));
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (uiState.newExcludedFolder && !config.excludedFolders.includes(uiState.newExcludedFolder)) {
                          updateConfig('excludedFolders', [...config.excludedFolders, uiState.newExcludedFolder]);
                          setUiState(prev => ({ ...prev, newExcludedFolder: '' }));
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: theme.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.large,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: COMMON_CONSTANTS.TRANSITIONS.fast
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {config.excludedFolders.map(folder => (
                      <div
                        key={folder}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background: theme.bg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}
                      >
                        <span>{folder}</span>
                        <button
                          onClick={() => updateConfig('excludedFolders', config.excludedFolders.filter(f => f !== folder))}
                          style={{
                            background: theme.surfaceHover,
                            border: `1px solid ${theme.borderHover}`,
                            color: theme.textSecondary,
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: '4px 8px',
                            borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.small,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            transition: COMMON_CONSTANTS.TRANSITIONS.fast
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = theme.error;
                            e.target.style.borderColor = theme.error;
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = theme.surfaceHover;
                            e.target.style.borderColor = theme.borderHover;
                            e.target.style.color = theme.textSecondary;
                          }}
                          title="Remove folder"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, ' + theme.accent + '10 0%, ' + theme.surface + ' 100%)',
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 16px 0',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>📚</span> Help & Documentation
                  </h3>
                  
                  <div style={{ fontSize: COMMON_CONSTANTS.FONT_SIZES.medium, lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ color: theme.text }}>Property Rules:</strong> 
                      <span style={{ color: theme.textSecondary }}> Add frontmatter to your notes:</span>
                    </div>
                    <pre style={{ 
                      margin: "0 0 16px 0", 
                      padding: "12px", 
                      background: theme.bg, 
                      borderRadius: "6px", 
                      overflow: 'auto',
                      border: `1px solid ${theme.border}`,
                      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal
                    }}>
{`---
eisenhower_status: urgent_important
due_date: 2024-12-25
recurring: weekly
---`}
                    </pre>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ color: theme.text }}>Task Rules:</strong>
                      <span style={{ color: theme.textSecondary }}> Add tags and dates to your tasks:</span>
                    </div>
                    <pre style={{ 
                      margin: 0, 
                      padding: "12px", 
                      background: theme.bg, 
                      borderRadius: "6px", 
                      overflow: 'auto',
                      border: `1px solid ${theme.border}`,
                      fontSize: COMMON_CONSTANTS.FONT_SIZES.normal
                    }}>
{`- [ ] Complete project #urgent-important 2024-12-25
- [ ] Review documents #schedule 📅 12/25/2024`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderNotifications() {
    if (!appState.notifications.length) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {appState.notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              backgroundColor: currentTheme === 'dark' ? '#2a2a2a' : '#ffffff',
              border: `1px solid ${currentTheme === 'dark' ? '#404040' : '#e2e8f0'}`,
              borderRadius: COMMON_CONSTANTS.BORDER_RADIUS.large,
              padding: '12px 16px',
              marginBottom: '8px',
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>
    );
  }

  /**************************************************************
   * Main Render
   **************************************************************/
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { 
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes searchSlideDown {
          from { 
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to { 
            opacity: 1;
            transform: translateX(-50%);
          }
        }
        @keyframes slideInRight {
          from { 
            transform: translateX(100%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .priority-matrix input[type="checkbox"] {
          cursor: pointer;
        }
        .priority-matrix button:hover {
          opacity: 0.9;
        }
        .priority-matrix button:active {
          transform: scale(0.98);
        }
        .cm-highlight {
          background-color: ${theme.accent}20 !important;
          animation: highlight-fade 2s ease-out;
        }
        @keyframes highlight-fade {
          0% { background-color: ${theme.accent}40 !important; }
          100% { background-color: ${theme.accent}20 !important; }
        }
        @media (max-width: 768px) {
          .priority-matrix-grid > div {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Drag and Drop Styles - only change opacity of dragged item */
        .dragging {
          opacity: 0.5 !important;
          cursor: move !important;
        }
        [draggable="true"] {
          cursor: move;
        }
        [draggable="true"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${theme.shadowHover};
        }
      `}</style>
      
      <div className="priority-matrix" style={styles.container}>
        <div className="priority-matrix-wrapper" style={styles.wrapper}>
          {/* Loading State */}
          {appState.isLoading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: currentTheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${theme.border}`,
                borderTop: `3px solid ${theme.accent}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}
          
          {/* Header */}
          <div 
            ref={headerRef}
            className="priority-matrix-header"
            style={{
              ...styles.header,
              ...(uiState.isHeaderWrapped ? styles.headerCentered : {})
            }}
          >
            <h1 className="priority-matrix-title" style={styles.title}>{config.ui.title}</h1>
            
            <div className="priority-matrix-toolbar" style={styles.toolbar} data-toolbar="true">
              {/* View Mode Dropdown */}
              <select
                value={config.display.viewMode}
                onChange={(e) => updateConfig('display.viewMode', e.target.value)}
                style={{
                  ...styles.toolButton,
                  paddingRight: '24px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${theme.textSecondary.replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
              >
                <option value="matrix">📊 Matrix View</option>
                <option value="list">📋 List View</option>
                <option value="merged">🔀 Merged View</option>
              </select>

              {/* Filter Dropdown */}
              <select
                value={config.display.filterBy}
                onChange={(e) => updateConfig('display.filterBy', e.target.value)}
                style={{
                  ...styles.toolButton,
                  paddingRight: '24px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${theme.textSecondary.replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
              >
                <option value="all">All Items</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={config.display.sortBy}
                onChange={(e) => updateConfig('display.sortBy', e.target.value)}
                style={{
                  ...styles.toolButton,
                  paddingRight: '24px',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${theme.textSecondary.replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
              >
                <option value="priority">Priority</option>
                <option value="date">Date</option>
                <option value="name">Name</option>
              </select>

              {/* Action Buttons */}
              <button
                onClick={() => setUiState(prev => ({ ...prev, showUnassignedCockpit: !prev.showUnassignedCockpit }))}
                style={{
                  ...styles.toolButton,
                  ...(uiState.showUnassignedCockpit ? styles.toolButtonActive : {})
                }}
                title="Unassigned Tasks Cockpit"
                aria-label={`Unassigned Tasks Cockpit${unassignedItems.notes.length + unassignedItems.tasks.length > 0 ? ` (${unassignedItems.notes.length + unassignedItems.tasks.length} items)` : ''}`}
                aria-pressed={uiState.showUnassignedCockpit}
              >
                📥 {unassignedItems.notes.length + unassignedItems.tasks.length > 0 && 
                    `(${unassignedItems.notes.length + unassignedItems.tasks.length})`}
              </button>
              
              <button
                onClick={handleOpenSearch}
                style={{
                  ...styles.toolButton,
                  ...(config.ui.showSearch ? styles.toolButtonActive : {})
                }}
                title="Search"
                aria-label="Search notes and tasks"
                aria-pressed={config.ui.showSearch}
              >
                🔍
              </button>
              
              <button
                onClick={handleOpenStats}
                style={{
                  ...styles.toolButton,
                  ...(config.ui.showStats ? styles.toolButtonActive : {})
                }}
                title="Statistics"
                aria-label="View statistics"
                aria-pressed={config.ui.showStats}
              >
                📊
              </button>
              
              <button
                onClick={() => updateConfig('ui.showSettings', true)}
                style={{
                  ...styles.toolButton,
                  ...(config.ui.showSettings ? styles.toolButtonActive : {})
                }}
                title="Settings"
                aria-label="Open settings"
                aria-pressed={config.ui.showSettings}
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.main}>
            {/* Unassigned Cockpit */}
            {renderUnassignedCockpit()}

            {/* Matrix View */}
            {config.display.viewMode === "matrix" && (() => {
              // Group sections by row
              const rowsMap = {};
              Object.entries(sectionData).forEach(([key, section]) => {
                const row = section.position.row;
                if (!rowsMap[row]) rowsMap[row] = [];
                rowsMap[row].push({ key, section });
              });
              
              // Sort sections within each row by column
              Object.values(rowsMap).forEach(row => {
                row.sort((a, b) => a.section.position.col - b.section.position.col);
              });
              
              // Get sorted rows
              const sortedRows = Object.keys(rowsMap)
                .map(Number)
                .sort((a, b) => a - b);
              
              return (
                <div className="priority-matrix-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedRows.map(rowNum => {
                    const sectionsInRow = rowsMap[rowNum];
                    const columnCount = sectionsInRow.length > 0 
                      ? Math.max(...sectionsInRow.map(s => s.section.position.col || 0)) + 1
                      : 1;
                    
                    return (
                      <div 
                        key={rowNum}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                          gap: COMMON_CONSTANTS.SPACING.lg
                        }}
                      >
                        {/* Create placeholders for empty columns */}
                        {Array.from({ length: columnCount }).map((_, colIndex) => {
                          const section = sectionsInRow.find(s => s.section.position.col === colIndex);
                          if (section) {
                            return renderMatrixSection(section.key, section.section);
                          }
                          // Empty placeholder for missing columns
                          return <div key={`empty-${rowNum}-${colIndex}`} />;
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* List View */}
            {config.display.viewMode === "list" && (
              <div style={styles.listContainer}>
                {Object.entries(sectionData).map(([sectionKey, section]) => (
                  <div key={sectionKey} style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      ...styles.sectionTitle, 
                      color: section.color,
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: `1px solid ${theme.border}`
                    }}>
                      {section.title}
                      <span style={{ 
                        fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
                        padding: '2px 8px',
                        background: `${section.color}20`,
                        borderRadius: '12px',
                        fontWeight: '500',
                        marginLeft: '8px'
                      }}>
                        {section.notes.length + section.tasks.length}
                      </span>
                    </h3>
                    {section.notes.length === 0 && section.tasks.length === 0 ? (
                      <div style={{ ...styles.emptyState, padding: '16px' }}>No items</div>
                    ) : (
                      <div style={styles.listContainer}>
                        {config.display.showNotes && section.notes.map(note => 
                          <OptimizedItem 
                            key={note.$path} 
                            item={note} 
                            type="note" 
                            sectionColor={section.color}
                            theme={theme}
                            config={config}
                            onItemClick={handleItemClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            interactionState={interactionState}
                            handleTaskToggle={handleTaskToggle}
                          />
                        )}
                        {config.display.showTasks && section.tasks.map(task => 
                          <OptimizedItem 
                            key={`${task.$file}-${task.$line}`} 
                            item={task} 
                            type="task" 
                            sectionColor={section.color}
                            theme={theme}
                            config={config}
                            onItemClick={handleItemClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            interactionState={interactionState}
                            handleTaskToggle={handleTaskToggle}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Merged View */}
            {config.display.viewMode === "merged" && (
              <div style={styles.mergedContainer}>
                <h3 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>
                  All Items
                  <span style={{ 
                    fontSize: COMMON_CONSTANTS.FONT_SIZES.normal,
                    padding: '2px 8px',
                    background: `${theme.accent}20`,
                    borderRadius: '12px',
                    fontWeight: '500',
                    marginLeft: '8px'
                  }}>
                    {Object.values(sectionData).reduce((sum, section) => 
                      sum + section.notes.length + section.tasks.length, 0
                    )}
                  </span>
                </h3>
                <div style={styles.listContainer}>
                  {Object.entries(sectionData).map(([sectionKey, section]) => (
                    <div key={sectionKey}>
                      {config.display.showNotes && section.notes.map(note => (
                        <HoverableNoteItem
                          key={note.$path}
                          note={note}
                          section={section}
                          theme={theme}
                          config={config}
                          styles={styles}
                          formatDate={formatDate}
                          isOverdue={isOverdue}
                        />
                      ))}
                      
                      {config.display.showTasks && section.tasks.map(task => (
                        <HoverableTaskItem
                          key={`${task.$file}-${task.$line}`}
                          task={task}
                          section={section}
                          theme={theme}
                          config={config}
                          styles={styles}
                          formatDate={formatDate}
                          isOverdue={isOverdue}
                          extractTaskDate={extractTaskDate}
                          handleTaskToggle={handleTaskToggle}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popups */}
        {renderSearchPopup()}
        {renderStatsPopup()}
        {renderSettingsPopup()}
        {renderNotifications()}
      </div>
    </>
  );
}

// Register component globally for DataCore
window.PriorityMatrix = PriorityMatrix;