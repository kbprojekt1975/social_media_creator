import React from 'react';

const HistoryDrawer = ({ 
  isHistoryDrawerOpen, 
  toggleHistoryDrawer, 
  history, 
  expandedHistoryItems, 
  toggleAllHistory, 
  toggleHistoryItem, 
  copyToClipboard, 
  handleEditHistoryItem, 
  handleDeleteHistory 
}) => {
  // Logic to nest posts under their respective campaigns
  const groupedHistory = [];
  const campaignPostsMap = {};

  // First, find all posts that belong to a campaign
  history.forEach(item => {
    if (item.historyType === 'post' && item.campaignId) {
      if (!campaignPostsMap[item.campaignId]) {
        campaignPostsMap[item.campaignId] = [];
      }
      campaignPostsMap[item.campaignId].push(item);
    }
  });

  // Then, build the final list, excluding those nested posts but adding them to campaigns
  history.forEach(item => {
    if (item.historyType === 'campaign') {
      groupedHistory.push({
        ...item,
        children: campaignPostsMap[item.id] || []
      });
    } else if (item.historyType === 'editor' || (item.historyType === 'post' && !item.campaignId)) {
      groupedHistory.push(item);
    }
  });

  return (
    <>
      <div 
        className="history-drawer"
        style={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: '30%',
          minWidth: '400px',
          zIndex: 1000,
          padding: '2.5rem', 
          borderRadius: '0 8px 8px 0', 
          background: 'var(--bg-card)', 
          borderRight: '1px solid var(--border-color)',
          borderLeft: 'none',
          boxShadow: 'var(--shadow-lg)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHistoryDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700' }}>Historia</h2>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {history.length > 0 && (
              <button 
                onClick={() => toggleAllHistory(Object.keys(expandedHistoryItems).length === 0)}
                style={{ 
                  background: 'var(--bg-app)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--color-primary)', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  fontWeight: '700',
                  padding: '0.5rem 1rem',
                  borderRadius: '3px',
                  transition: 'all 0.2s'
                }}
              >
                {Object.keys(expandedHistoryItems).length === 0 ? 'Rozwiń wszystkie' : 'Zwiń wszystkie'}
              </button>
            )}
            <button 
              onClick={toggleHistoryDrawer}
              style={{ background: 'var(--bg-app)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.4rem', borderRadius: '10px' }}
            >
              <span className="material-icons">first_page</span>
            </button>
          </div>
        </div>
        
        <div className="history-list" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'stretch',
          gap: '1.2rem', 
          overflowY: 'auto',
          paddingRight: '0.5rem',
          scrollbarGutter: 'stable'
        }}>
          {groupedHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Brak wygenerowanych treści.</p>
          ) : (
            groupedHistory.map(item => {
              const isExpanded = !!expandedHistoryItems[item.id];
              return (
                <div key={item.id} style={{
                  background: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  flexShrink: 0
                }}>
                  <div 
                    onClick={() => toggleHistoryItem(item.id)}
                    style={{ 
                      padding: '1.2rem 1.8rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        {item.topic?.slice(0, 35)}{item.topic?.length > 35 ? '...' : ''}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                          {item.platform}
                        </span>
                        {item.historyType === 'campaign' && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            background: 'var(--color-primary)', 
                            color: 'white', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px', 
                            fontWeight: '900' 
                          }}>
                            KAMPANIA
                          </span>
                        )}
                        {item.historyType === 'editor' && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            background: '#8b5cf6', 
                            color: 'white', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px', 
                            fontWeight: '900' 
                          }}>
                            EDYTOR
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : (item.createdAt instanceof Date ? item.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : '')}
                        </span>
                      </div>
                    </div>
                    <span className="material-icons" style={{ 
                      color: 'var(--color-primary)', 
                      transition: 'transform 0.3s', 
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      fontSize: '1.8rem' 
                    }}>
                      expand_more
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ 
                      padding: '1.5rem 1.8rem', 
                      borderTop: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem'
                    }}>
                      {/* Children list for campaigns */}
                      {item.historyType === 'campaign' && item.children && item.children.length > 0 && (
                        <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                          <h6 style={{ margin: '0 0 0.8rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posty w tej kampanii:</h6>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {item.children.map(child => (
                              <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '3px' }}>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.topic}</p>
                                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{child.platform} • {new Date(child.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditHistoryItem(child); }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex' }}
                                  title="Edytuj post"
                                >
                                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>edit</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.9rem', 
                        lineHeight: '1.6', 
                        color: 'var(--text-main)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {item.content}
                      </p>
                        
                      {(item.imageUrl || (item.historyType === 'editor' && item.mediaHistory?.length > 0)) && (
                        <img 
                          src={item.imageUrl || item.mediaHistory[item.mediaHistory.length - 1].url} 
                          alt="History" 
                          style={{ width: '100%', borderRadius: '15px', marginTop: '1rem', border: '1px solid var(--border-color)' }} 
                        />
                      )}
                      {item.videoUrl && (
                        <video src={item.videoUrl} controls style={{ width: '100%', borderRadius: '15px', marginTop: '1rem', background: '#000' }} />
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                          {item.historyType === 'post' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content); }}
                              className="btn-secondary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '3px' }}
                            >
                              Kopiuj
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditHistoryItem(item); }}
                            className="btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                          >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>
                              {item.historyType === 'campaign' ? 'visibility' : (item.historyType === 'editor' ? 'brush' : 'edit')}
                            </span>
                            {item.historyType === 'campaign' ? 'Zobacz kampanię' : (item.historyType === 'editor' ? 'Kontynuuj edycję' : 'Edytuj')}
                          </button>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id, item.historyType); }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                        >
                          <span className="material-icons" style={{ fontSize: '1.1rem' }}>delete_outline</span>
                          Usuń
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Drawer Trigger */}
      {!isHistoryDrawerOpen && (
        <button 
          className="desktop-floating-btn"
          onClick={toggleHistoryDrawer}
          style={{
            position: 'fixed',
            left: '1.5rem',
            bottom: '2.5rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            cursor: 'pointer',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            transition: 'transform 0.3s ease',
            animation: 'fadeIn 0.5s ease-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-icons" style={{ fontSize: '2rem' }}>history</span>
        </button>
      )}
    </>
  );
};

export default HistoryDrawer;
