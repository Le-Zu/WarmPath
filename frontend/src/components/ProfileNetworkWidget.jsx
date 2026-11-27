import { useState, useEffect, useRef, useMemo } from 'react';
import { Maximize2, Plus, Minus } from 'lucide-react';
import InfoTooltip from '@/components/InfoTooltip';

export default function ProfileNetworkWidget({ connections, connectorCount }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, node: null });

  // 1. Classify Connections
  // Direct Connectors are connections accepted/created in the past
  // Awaiting Reply are pending connections sent by the user
  // New Connections are recently accepted connections (e.g., last 7 days)
  const classifiedNodes = useMemo(() => {
    const nodesMap = new Map();
    const links = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // You Node
    nodesMap.set('you', {
      id: 'you',
      label: 'You',
      type: 'you',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 34,
    });

    // Helper for initials
    const getInitials = (first, last) => {
      return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
    };

    // Name counts for disambiguation
    const nameCounts = {};
    connections.forEach(c => {
      const firstName = c.peer.first_name?.toLowerCase();
      if (firstName) nameCounts[firstName] = (nameCounts[firstName] || 0) + 1;
    });

    const formatName = (first, last) => {
      if (!first) return '';
      if (last && nameCounts[first.toLowerCase()] > 1) {
        return `${first} ${last[0]}.`;
      }
      return first;
    };

    connections.forEach((c) => {
      const isAwaiting = c.status === 'pending';
      const acceptedAt = c.accepted_at ? new Date(c.accepted_at) : new Date(c.created_at);
      const isNew = c.status === 'accepted' && acceptedAt > sevenDaysAgo;
      const isConnector = c.status === 'accepted' && acceptedAt <= sevenDaysAgo;

      const nodeKey = `peer-${c.peer.id || c.connection_id}`;
      let statusType = 'connector'; // default
      if (isAwaiting) statusType = 'awaiting';
      else if (isNew) statusType = 'new';

      const fullName = `${c.peer.first_name || ''} ${c.peer.last_name || ''}`.trim();

      nodesMap.set(nodeKey, {
        id: nodeKey,
        label: formatName(c.peer.first_name, c.peer.last_name) || c.peer.email,
        fullName,
        type: 'peer',
        pfp: c.peer.profile_picture_url,
        initials: getInitials(c.peer.first_name, c.peer.last_name),
        status: statusType,
        radius: 24,
      });

      links.push({
        source: 'you',
        target: nodeKey,
        type: 'primary',
      });
    });

    // Generate connector-to-connector links (community density)
    // We link connector nodes with a 25% random probability to show density
    const peerNodes = Array.from(nodesMap.values()).filter(n => n.id !== 'you');
    for (let i = 0; i < peerNodes.length; i++) {
      for (let j = i + 1; j < peerNodes.length; j++) {
        // Only draw between connectors, with low probability
        if (peerNodes[i].status === 'connector' && peerNodes[j].status === 'connector') {
          // Deterministic pseudo-random link based on IDs to avoid visual jumping
          const combinedStr = peerNodes[i].id + peerNodes[j].id;
          let hash = 0;
          for (let k = 0; k < combinedStr.length; k++) {
            hash = combinedStr.charCodeAt(k) + ((hash << 5) - hash);
          }
          if (Math.abs(hash % 100) < 25) {
            links.push({
              source: peerNodes[i].id,
              target: peerNodes[j].id,
              type: 'inter-connector',
            });
          }
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [connections]);

  const canvasWidth = isExpanded ? 800 : 340;
  const canvasHeight = isExpanded ? 500 : 220;

  // Handle canvas drawing buffer dimensions on resize and expanded state toggle.
  // Measures the canvas's *displayed* CSS size rather than the viewport so the
  // pixel buffer matches whatever space the parent gives us — works the same
  // in both inline and fullscreen modes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = w;
      canvas.height = h;
      transformRef.current.x = w / 2;
      transformRef.current.y = h / 2;
    };

    // Run twice: once now, once after layout settles (rAF) so the second pass
    // catches the post-toggle dimensions even if the first measured stale ones.
    handleResize();
    const rafId = requestAnimationFrame(handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isExpanded, canvasWidth, canvasHeight]);

  // Deterministic orbital layout — runs once per data change.
  // Inner ring scales with connector count so big networks aren't cramped.
  useEffect(() => {
    const allNodes = classifiedNodes.nodes;
    const you = allNodes.find((n) => n.id === 'you');
    if (you) {
      you.x = 0;
      you.y = 0;
    }
    const connectors = allNodes.filter((n) => n.id !== 'you' && n.status === 'connector');
    const newConns = allNodes.filter((n) => n.id !== 'you' && n.status === 'new');
    const awaiting = allNodes.filter((n) => n.id !== 'you' && n.status === 'awaiting');

    const peerR = connectors[0]?.radius ?? newConns[0]?.radius ?? awaiting[0]?.radius ?? 24;
    const minSeparation = peerR * 3.5;
    const ringFromCount = (count) =>
      count <= 1
        ? 220
        : Math.max(220, minSeparation / (2 * Math.sin(Math.PI / count)));

    // Active connectors + new connectors share the inner ring (treated equally
    // for layout — visual differentiation is the node fill/border color).
    const inner = [...connectors, ...newConns];
    const innerR = ringFromCount(inner.length);
    inner.forEach((c, i) => {
      const angle = (i / Math.max(inner.length, 1)) * Math.PI * 2 - Math.PI / 2;
      c.x = Math.cos(angle) * innerR;
      c.y = Math.sin(angle) * innerR;
    });

    // Awaiting nodes: lower arc, dimmed
    const awaitingR = Math.max(innerR + 80, ringFromCount(awaiting.length) + 60);
    awaiting.forEach((c, i) => {
      const step = awaiting.length > 1 ? 0.9 / (awaiting.length - 1) : 0;
      const baseAngle = Math.PI / 2;
      const angle = baseAngle - 0.45 + i * step;
      c.x = Math.cos(angle) * awaitingR;
      c.y = Math.sin(angle) * awaitingR;
    });
  }, [classifiedNodes]);

  // Render loop — repaints on every frame to reflect pan/zoom/drag.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageCache = {};
    let animationFrameId;

    const tick = () => {
      // Apply pinned positions from drag (fx/fy), otherwise leave x/y alone
      classifiedNodes.nodes.forEach((node) => {
        if (node.fx !== undefined && node.fx !== null) {
          node.x = node.fx;
          node.y = node.fy;
        }
      });

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      // Draw Grid
      ctx.strokeStyle = 'rgba(0,0,0,0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const rangeLimit = 2000;
      for (let x = -rangeLimit; x <= rangeLimit; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, -rangeLimit); ctx.lineTo(x, rangeLimit); ctx.stroke();
      }
      for (let y = -rangeLimit; y <= rangeLimit; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(-rangeLimit, y); ctx.lineTo(rangeLimit, y); ctx.stroke();
      }

      const isDimmed = (n) => n && n.status === 'awaiting';

      // Draw Links
      classifiedNodes.links.forEach((link) => {
        const sourceNode = classifiedNodes.nodes.find(n => n.id === link.source);
        const targetNode = classifiedNodes.nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const dim = isDimmed(sourceNode) || isDimmed(targetNode);
        ctx.save();
        ctx.globalAlpha = dim ? 0.35 : 1;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (link.type === 'primary') {
          ctx.strokeStyle = 'rgba(56, 102, 65, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // Draw Nodes
      classifiedNodes.nodes.forEach((node) => {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.globalAlpha = isDimmed(node) ? 0.5 : 1;

        // Core status color settings (Standard Hex colors for Canvas)
        let primaryColor = '#386641'; // Forest green (Connector)
        let nameColor = '#386641';
        if (node.type === 'you') {
          primaryColor = '#e76f51'; // Terracotta
          nameColor = '#e76f51';
        } else if (node.status === 'awaiting') {
          primaryColor = '#f4a261'; // Muted Amber
          nameColor = '#f4a261';
        } else if (node.status === 'new') {
          primaryColor = '#e76f51'; // Warm Terracotta
          nameColor = '#e76f51';
        }

        // Glow effect
        if (node.pfp) {
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 4;
        }

        // Draw ellipse base
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.pfp ? '#fff' : primaryColor;
        ctx.fill();

        // Node border
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow

        // Render PFP image if available (cached)
        if (node.pfp) {
          let img = imageCache[node.pfp];
          if (!img) {
            img = new Image();
            img.src = node.pfp;
            imageCache[node.pfp] = img;
          }
          
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, node.radius - 1, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, -node.radius, -node.radius, node.radius * 2, node.radius * 2);
            ctx.restore();
          } else {
            ctx.fillStyle = primaryColor;
            ctx.fill();
            
            // Draw initials fallback while loading PFP
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${node.radius * 0.55}px var(--font-sans)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.type === 'you' ? 'YOU' : node.initials || '?', 0, 0.5);
          }
        }

        // Initials fallback (if no PFP)
        if (!node.pfp) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${node.radius * 0.55}px var(--font-sans)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.type === 'you' ? 'YOU' : node.initials || '?', 0, 0.5);
        }

        // Name label
        ctx.fillStyle = node.type === 'you' ? '#2d2a26' : nameColor;
        ctx.font = '500 11px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label || '', 0, node.radius + 15);

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [classifiedNodes]);

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left - transformRef.current.x) / transformRef.current.k;
    const y = (clientY - rect.top - transformRef.current.y) / transformRef.current.k;
    return { x, y, clientX, clientY };
  };

  const CLICK_DRAG_THRESHOLD = 5;
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 2.2;
  const ZOOM_STEP = 1.2;

  const applyZoom = (factor) => {
    const next = transformRef.current.k * factor;
    transformRef.current.k = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  };

  const hitTestNode = (x, y) =>
    classifiedNodes.nodes.find((node) => {
      if (node.x === undefined) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

  const handleStart = (e) => {
    const { x, y, clientX, clientY } = getCanvasCoords(e);
    const clickedNode = hitTestNode(x, y);
    dragRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastY: clientY,
      node: clickedNode && clickedNode.id !== 'you' ? clickedNode : null,
    };
  };

  const handleMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (!dragRef.current.isDragging) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasCoords(e);
      const hovered = hitTestNode(x, y);
      canvas.style.cursor =
        hovered && hovered.id !== 'you' ? 'pointer' : 'grab';
      return;
    }

    const dx = clientX - dragRef.current.lastX;
    const dy = clientY - dragRef.current.lastY;
    const totalDx = clientX - dragRef.current.startX;
    const totalDy = clientY - dragRef.current.startY;

    if (
      !dragRef.current.hasMoved &&
      Math.hypot(totalDx, totalDy) > CLICK_DRAG_THRESHOLD
    ) {
      dragRef.current.hasMoved = true;
      if (dragRef.current.node) {
        dragRef.current.node.fx = dragRef.current.node.x;
        dragRef.current.node.fy = dragRef.current.node.y;
      }
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }

    if (!dragRef.current.hasMoved) {
      dragRef.current.lastX = clientX;
      dragRef.current.lastY = clientY;
      return;
    }

    if (dragRef.current.node) {
      const node = dragRef.current.node;
      node.fx = node.x + dx / transformRef.current.k;
      node.fy = node.y + dy / transformRef.current.k;
    } else {
      transformRef.current.x += dx;
      transformRef.current.y += dy;
    }

    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;
  };

  const handleEnd = () => {
    const { hasMoved, node, isDragging } = dragRef.current;
    if (!isDragging) return;
    if (hasMoved && node) {
      node.fx = null;
      node.fy = null;
    }
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
    dragRef.current = {
      isDragging: false,
      hasMoved: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      node: null,
    };
  };

  // Non-passive wheel listener so zoom always captures the scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onNativeWheel = (e) => {
      e.preventDefault();
      applyZoom(e.deltaY < 0 ? 1.05 : 1 / 1.05);
    };
    canvas.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onNativeWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper styling — in expanded mode the WRAPPER (not the canvas) goes
  // fullscreen, so we sidestep any parent containing-block quirks that
  // previously made the position:fixed canvas render blank.
  const wrapperStyles = isExpanded
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: 'rgba(20, 28, 22, 0.55)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
      }
    : { position: 'relative', width: '100%' };

  const canvasStyles = isExpanded
    ? {
        flex: 1,
        width: '100%',
        height: '100%',
        background: '#fcfbfa',
        borderRadius: 8,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        touchAction: 'none',
      }
    : {
        width: '100%',
        height: `${canvasHeight}px`,
        background: '#fcfbfa',
        border: '1.5px solid var(--border)',
        borderRadius: 4,
        touchAction: 'none',
      };

  const zoomBtnStyle = {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    background: '#fff',
    color: 'var(--charcoal)',
    cursor: 'pointer',
    fontSize: 0,
    padding: 0,
  };

  const legendItems = [
    { label: 'You', color: '#e76f51', dim: false },
    { label: 'Connector', color: '#386641', dim: false },
    { label: 'New', color: '#e76f51', dim: false },
    { label: 'Pending', color: '#f4a261', dim: true },
  ];

  return (
    <div style={wrapperStyles}>
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            color: '#fff',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                color: 'var(--dark)',
                fontWeight: 500,
              }}
            >
              🌐 Connection Network Graph
            </span>
            <InfoTooltip
              label="Network Diagram"
              text="Green: established connectors. Terracotta: new connectors. Amber (faded): awaiting reply. Scroll or use the +/- buttons to zoom; drag the canvas to pan."
            />
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="btn-primary"
            style={{
              fontSize: '0.85rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            Close Fullscreen
          </button>
        </div>
      )}

      {/* Inner relative wrapper so absolute overlays stack against the canvas */}
      <div style={{ position: 'relative', flex: isExpanded ? 1 : 'unset' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{
            ...canvasStyles,
            cursor: 'grab',
            display: 'block',
          }}
        />

        {/* Zoom controls — visible in both modes */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'inline-flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => applyZoom(ZOOM_STEP)}
            style={{ ...zoomBtnStyle, borderBottom: 'none' }}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => applyZoom(1 / ZOOM_STEP)}
            style={zoomBtnStyle}
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '0.5rem 0.65rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem 0.75rem',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-sans)',
            color: '#5a5550',
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            maxWidth: 'calc(100% - 80px)',
          }}
        >
          {legendItems.map((it) => (
            <span
              key={it.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: it.dim ? 0.55 : 1,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: it.color,
                  display: 'inline-block',
                  border: `1.5px solid ${it.color}`,
                }}
              />
              {it.label}
            </span>
          ))}
        </div>

        {/* Expand-to-fullscreen affordance, inline mode only */}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title="Expand fullscreen"
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              color: 'var(--charcoal)',
            }}
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
