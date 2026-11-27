import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Info, HelpCircle, Plus, Minus } from 'lucide-react';
import { getConnections } from '@/services/connections';
import { getPaths } from '@/services/paths';
import InfoTooltip from '@/components/InfoTooltip';

export default function LivingNetworkWidget({ activeIntentId, onSelectPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState([]);
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Load network data
  useEffect(() => {
    setLoading(true);
    Promise.all([getConnections(), getPaths()])
      .then(([connData, pathData]) => {
        setConnections(connData.connections || []);
        setPaths(pathData.paths || []);
      })
      .catch((err) => {
        console.error('Failed to load network data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Preselect the warmest available target so the detail panel renders on open
  useEffect(() => {
    if (selectedNode) return;
    const warmest = paths.find((p) => p?.target?.name);
    if (!warmest) return;
    setSelectedNode({
      id: `target-${warmest.target.id || warmest.target.name}`,
      type: 'target',
      fullName: warmest.target.name,
      role: warmest.target.role,
      pathData: warmest,
    });
    if (onSelectPath) onSelectPath(warmest);
  }, [paths, selectedNode, onSelectPath]);

  // Filter connections and paths based on intent and search query
  const filteredData = useMemo(() => {
    let activePaths = [...paths];
    let activeConns = [...connections];

    // 1. Intent Category Filtering
    if (activeIntentId) {
      activePaths = activePaths.filter(p => p.intent_category === activeIntentId);
    }

    // 2. Search Query Filtering (Name, Company, Skill)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      
      // Keep paths where target name, target role/company, or connector name matches
      activePaths = activePaths.filter(p => {
        const targetName = p.target.name?.toLowerCase() || '';
        const targetRole = p.target.role?.toLowerCase() || '';
        const targetExperiences = p.target.experiences?.map(e => e.company?.toLowerCase() || '').join(' ') || '';
        const targetSkills = p.target.interests?.map(i => i.toLowerCase() || '').join(' ') || '';
        const connectorName = p.connector.name?.toLowerCase() || '';

        return targetName.includes(q) || 
               targetRole.includes(q) || 
               targetExperiences.includes(q) ||
               targetSkills.includes(q) ||
               connectorName.includes(q);
      });

      // Keep connections matching name
      activeConns = activeConns.filter(c => {
        const name = `${c.peer?.first_name || ''} ${c.peer?.last_name || ''}`.toLowerCase();
        const relationship = c.context?.toLowerCase() || '';
        return name.includes(q) || relationship.includes(q);
      });
    }

    return { activePaths, activeConns };
  }, [connections, paths, activeIntentId, searchQuery]);

  // Construct Graph Nodes and Links
  const graph = useMemo(() => {
    const nodesMap = new Map();
    const links = [];

    // Base Node: YOU
    nodesMap.set('you', {
      id: 'you',
      label: 'You',
      type: 'you',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: 0,
      fy: 0,
      radius: 34,
    });

    // Helper to get initials
    const getInitials = (name) => {
      if (!name) return '?';
      const parts = name.trim().split(/\s+/);
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    };

    // Helper for disambiguation (if first name duplicates, use last initial)
    const allNames = [
      ...filteredData.activeConns.map(c => `${c.peer?.first_name || ''} ${c.peer?.last_name || ''}`),
      ...filteredData.activePaths.map(p => p.target.name),
      ...filteredData.activePaths.map(p => p.connector.name),
    ];
    const nameCounts = {};
    allNames.forEach(n => {
      if (!n) return;
      const firstName = n.trim().split(/\s+/)[0]?.toLowerCase();
      if (firstName) nameCounts[firstName] = (nameCounts[firstName] || 0) + 1;
    });

    const formatDisplayName = (fullName) => {
      if (!fullName) return '';
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts[1];
      if (firstName && lastName && nameCounts[firstName.toLowerCase()] > 1) {
        return `${firstName} ${lastName[0]}.`;
      }
      return firstName || '';
    };

    // Add Direct Connectors
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    filteredData.activeConns.forEach((c) => {
      const isAwaiting = c.status === 'pending';
      const acceptedAt = c.accepted_at ? new Date(c.accepted_at) : new Date(c.created_at);
      const isNew = c.status === 'accepted' && acceptedAt > sevenDaysAgo;
      
      let statusType = 'active'; // connector
      if (isAwaiting) statusType = 'awaiting';
      else if (isNew) statusType = 'new';

      const fullName = `${c.peer?.first_name || ''} ${c.peer?.last_name || ''}`.trim();
      const nodeKey = `conn-${c.peer?.id || c.connection_id}`;
      nodesMap.set(nodeKey, {
        id: nodeKey,
        label: formatDisplayName(fullName) || c.peer?.email || '?',
        fullName,
        type: 'connector',
        pfp: c.peer?.profile_picture_url,
        initials: getInitials(fullName),
        status: statusType,
        radius: 26,
      });

      links.push({
        source: 'you',
        target: nodeKey,
        type: 'connector-link',
      });
    });

    // Add Path targets & connectors from paths
    filteredData.activePaths.forEach((path) => {
      const connName = path.connector.name;
      const connKey = `conn-${path.connector.id || connName}`;
      
      // Ensure connector exists
      if (!nodesMap.has(connKey)) {
        const matchedConn = connections.find(c => (c.peer?.id === path.connector.id) || (`${c.peer?.first_name || ''} ${c.peer?.last_name || ''}`.trim() === connName));
        let statusType = 'active';
        if (matchedConn) {
          const isAwaiting = matchedConn.status === 'pending';
          const acceptedAt = matchedConn.accepted_at ? new Date(matchedConn.accepted_at) : new Date(matchedConn.created_at);
          const isNew = matchedConn.status === 'accepted' && acceptedAt > sevenDaysAgo;
          if (isAwaiting) statusType = 'awaiting';
          else if (isNew) statusType = 'new';
        }

        nodesMap.set(connKey, {
          id: connKey,
          label: formatDisplayName(connName),
          fullName: connName,
          type: 'connector',
          pfp: path.connector.pictureUrl,
          initials: getInitials(connName),
          status: statusType,
          radius: 26,
        });

        links.push({
          source: 'you',
          target: connKey,
          type: 'connector-link',
        });
      }

      // Add Target Node
      const targetName = path.target.name;
      const targetKey = `target-${path.target.id || targetName}`;
      if (!nodesMap.has(targetKey)) {
        nodesMap.set(targetKey, {
          id: targetKey,
          label: formatDisplayName(targetName),
          fullName: targetName,
          type: 'target',
          pfp: path.target.pictureUrl,
          initials: getInitials(targetName),
          status: path.target.isAnonymous ? 'anonymous' : 'public',
          role: path.target.role,
          radius: 26,
          pathData: path, // Link back to request path details
        });
      }

      // Link Connector to Target
      links.push({
        source: connKey,
        target: targetKey,
        type: 'target-link',
        relation: path.connector.targetRelation,
        strength: path.strength,
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [filteredData]);

  return (
    <div
      className="app-card"
      style={{
        width: '100%',
        padding: 0,
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
        marginBottom: '2.5rem'
      }}
    >
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'var(--white)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.15rem',
          color: 'var(--dark)',
          fontWeight: 500,
          textAlign: 'left'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          🌐 Explore Your Living Network & Paths (Interactive)
          <InfoTooltip 
            label="Interactive Network Graph" 
            text="Visual Map: Green nodes are your direct connectors. Orange nodes are target contacts. Paths represent introductions you can request. Drag to pan, scroll to zoom." 
          />
        </span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid #f0e8e4', background: '#fcfbfa' }}>
          {/* Search Inputs */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} 
            />
            <input
              type="text"
              placeholder="Search network by name, company, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.3rem',
                border: '1.5px solid var(--border)',
                borderRadius: 4,
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                background: '#fff',
                outline: 'none',
              }}
            />
          </div>

          {/* Network Canvas or Loading Screen */}
          {loading ? (
            <div style={{
              height: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              background: '#fcfbfa',
              border: '1.5px solid var(--border)',
              borderRadius: '4px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(231, 111, 81, 0.1)',
                borderTopColor: 'var(--warm)',
                borderRadius: '50%',
                animation: 'wp-spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '0.9rem', color: '#7a6f68', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>
                Loading your living network...
              </span>
            </div>
          ) : (
            <NetworkCanvas 
              nodes={graph.nodes} 
              links={graph.links} 
              searchQuery={searchQuery}
              selectedNode={selectedNode}
              onSelectNode={(node) => {
                setSelectedNode(node);
                if (node?.pathData && onSelectPath) {
                  onSelectPath(node.pathData);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Canvas Rendering Component with Force Simulation
function NetworkCanvas({ nodes, links, searchQuery, selectedNode, onSelectNode }) {
  const canvasRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const imageCacheRef = useRef({});
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, node: null });

  // Standard color constants to avoid CSS variables in canvas contexts
  const COLORS = {
    you: '#e76f51',          // Terracotta
    connector: '#386641',    // Forest Green
    new: '#e76f51',          // Orange / Warm Terracotta
    awaiting: '#f4a261',     // Muted Amber
    target: '#a09792',       // Grayed out potential contact
    haloYou: 'rgba(231, 111, 81, 0.15)',
    haloConnector: 'rgba(56, 102, 65, 0.15)',
    haloNew: 'rgba(231, 111, 81, 0.15)',
    haloAwaiting: 'rgba(244, 162, 97, 0.15)',
    haloTarget: 'rgba(160, 151, 146, 0.15)'
  };

  // Deterministic orbital layout — recomputed when the node set changes.
  // Inner-ring radius scales with connector count so 14+ connectors don't
  // crowd a small circle. Target nodes orbit their introducing connector.
  useEffect(() => {
    const you = nodes.find((n) => n.id === 'you');
    if (you) {
      you.x = 0;
      you.y = 0;
      you.fx = 0;
      you.fy = 0;
    }

    const activeConns = nodes.filter(
      (n) => n.type === 'connector' && (n.status === 'active' || n.status === 'new')
    );
    const pendingConns = nodes.filter(
      (n) => n.type === 'connector' && n.status === 'awaiting'
    );
    const targets = nodes.filter((n) => n.type === 'target');

    // Minimum chord between adjacent nodes ≈ 3.5× radius gives a clean gap.
    const nodeR = activeConns[0]?.radius ?? 26;
    const minSeparation = nodeR * 3.5;
    const ringFromCount = (count) =>
      count <= 1
        ? 240
        : Math.max(240, minSeparation / (2 * Math.sin(Math.PI / count)));

    const innerR = ringFromCount(activeConns.length);
    activeConns.forEach((c, i) => {
      const angle = (i / Math.max(activeConns.length, 1)) * Math.PI * 2 - Math.PI / 2;
      c.x = Math.cos(angle) * innerR;
      c.y = Math.sin(angle) * innerR;
    });

    // Pending connectors: lower arc, faded — placed beyond the active ring
    const pendingR = Math.max(innerR + 80, ringFromCount(pendingConns.length) + 60);
    pendingConns.forEach((c, i) => {
      const step = pendingConns.length > 1 ? 0.9 / (pendingConns.length - 1) : 0;
      const baseAngle = Math.PI / 2; // straight down
      const angle = baseAngle - 0.45 + i * step;
      c.x = Math.cos(angle) * pendingR;
      c.y = Math.sin(angle) * pendingR;
    });

    // Targets: orbit their introducing connector so the dashed link is short
    const targetOffset = nodeR * 4.5;
    targets.forEach((t, i) => {
      const link = links.find((l) => l.target === t.id);
      const connector = link ? nodes.find((n) => n.id === link.source) : null;
      if (connector && (connector.x !== undefined)) {
        const baseAngle = Math.atan2(connector.y, connector.x);
        const spread = ((i % 3) - 1) * 0.32;
        const angle = baseAngle + spread;
        const r = innerR + targetOffset + (i % 2) * 30;
        t.x = Math.cos(angle) * r;
        t.y = Math.sin(angle) * r;
      } else {
        const angle = (i / Math.max(targets.length, 1)) * Math.PI * 2;
        t.x = Math.cos(angle) * (innerR + targetOffset);
        t.y = Math.sin(angle) * (innerR + targetOffset);
      }
    });
  }, [nodes, links]);

  // Render loop — repaints the canvas on every frame to reflect pan/zoom/selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Center the world origin on the canvas on first mount
    if (transformRef.current.x === 0 && transformRef.current.y === 0) {
      transformRef.current.x = canvas.width / 2;
      transformRef.current.y = canvas.height / 2;
    }

    // Auto-focus camera on search match
    if (searchQuery.trim() && nodes.length > 0) {
      const q = searchQuery.toLowerCase();
      const match = nodes.find(n => n.id !== 'you' && (
        n.fullName?.toLowerCase().includes(q) ||
        n.role?.toLowerCase().includes(q)
      ));
      if (match && match.x !== undefined) {
        transformRef.current.x = canvas.width / 2 - match.x * transformRef.current.k;
        transformRef.current.y = canvas.height / 2 - match.y * transformRef.current.k;
      }
    }

    const tick = () => {
      // Apply node-drag overrides without running physics
      nodes.forEach((node) => {
        if (node.fx !== undefined && node.fx !== null) {
          node.x = node.fx;
          node.y = node.fy;
        }
      });

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid pattern (subtle Figma-ish layout)
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      const gridSize = 40;
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 1;
      const startX = -canvas.width * 3;
      const endX = canvas.width * 3;
      const startY = -canvas.height * 3;
      const endY = canvas.height * 3;

      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Helper — pending/target nodes render at reduced opacity unless selected/matched
      const isDimmed = (n) => {
        if (!n) return false;
        if (selectedNode?.id === n.id) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (
            n.fullName?.toLowerCase().includes(q) ||
            n.role?.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return n.type === 'target' || n.status === 'awaiting';
      };

      // 4. Draw Links
      links.forEach((link) => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const dim = isDimmed(sourceNode) || isDimmed(targetNode);
        ctx.save();
        ctx.globalAlpha = dim ? 0.35 : 1;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        ctx.lineWidth = link.type === 'connector-link' ? 1.5 : 1;
        ctx.strokeStyle = link.type === 'connector-link'
          ? 'rgba(56, 102, 65, 0.55)'
          : 'rgba(231, 111, 81, 0.4)';
        if (link.type === 'target-link') {
          ctx.setLineDash([3, 3]); // Dashed targets paths
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // 5. Draw Nodes
      nodes.forEach((node) => {
        ctx.save();
        ctx.translate(node.x, node.y);

        const isMatched = searchQuery.trim() && node.id !== 'you' && (
          node.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const isSelected = selectedNode?.id === node.id;
        const dim = isDimmed(node);
        ctx.globalAlpha = dim ? 0.45 : 1;

        const isTarget = node.type === 'target';
        let haloColor = COLORS.haloConnector;
        let strokeColor = COLORS.connector;

        if (node.type === 'you') {
          haloColor = COLORS.haloYou;
          strokeColor = COLORS.you;
        } else if (isTarget) {
          haloColor = COLORS.haloTarget;
          strokeColor = COLORS.target;
        } else if (node.status === 'new') {
          haloColor = COLORS.haloNew;
          strokeColor = COLORS.new;
        } else if (node.status === 'awaiting') {
          haloColor = COLORS.haloAwaiting;
          strokeColor = COLORS.awaiting;
        }

        if (isSelected || isMatched) {
          // Bright outer halo brings the node forward
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = haloColor;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Soft outer glow keyed to status — helps differentiate PFP nodes
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = isSelected ? 18 : 8;

        // Main Node Fill
        let nodeColor = COLORS.connector;
        if (node.type === 'you') nodeColor = COLORS.you;
        else if (node.type === 'target') nodeColor = COLORS.target;
        else if (node.status === 'new') nodeColor = COLORS.new;
        else if (node.status === 'awaiting') nodeColor = COLORS.awaiting;

        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.pfp ? '#fff' : nodeColor;
        ctx.fill();

        // Reset shadow for further drawing inside the node
        ctx.shadowBlur = 0;

        // Border colored by status
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw profile image if available (cached to prevent flickering)
        if (node.pfp) {
          let img = imageCacheRef.current[node.pfp];
          if (!img) {
            img = new Image();
            img.src = node.pfp;
            imageCacheRef.current[node.pfp] = img;
          }

          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, node.radius - 1, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, -node.radius, -node.radius, node.radius * 2, node.radius * 2);
            ctx.restore();
          } else {
            ctx.fillStyle = nodeColor;
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${node.radius * 0.55}px var(--font-sans)`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.initials || '?', 0, 0.5);
          }
        }

        // Initials fallback when no PFP
        if (!node.pfp) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${node.radius * 0.55}px var(--font-sans)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.type === 'you' ? 'YOU' : node.initials || '?', 0, 0.5);
        }

        // Name label below the node — colored by status so PFP nodes still differentiate
        ctx.fillStyle = node.type === 'you' ? '#2d2a26' : strokeColor;
        ctx.font = `${isSelected ? '600' : '500'} 11px var(--font-sans)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(node.label || '', 0, node.radius + 16);

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links, searchQuery, selectedNode]);

  // Convert client coordinate mouse event to canvas space coordinates
  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left - transformRef.current.x) / transformRef.current.k;
    const y = (clientY - rect.top - transformRef.current.y) / transformRef.current.k;
    return { x, y, clientX, clientY };
  };

  // Drag threshold — mouse-down + mouse-up within this many pixels counts
  // as a click (selection only). Beyond this, the gesture is a node drag or
  // a camera pan.
  const CLICK_DRAG_THRESHOLD = 5;

  const hitTestNode = (x, y) =>
    nodes.find((node) => {
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
      // Node grabbed by user; null if grabbing empty canvas (pan)
      node: clickedNode && clickedNode.id !== 'you' ? clickedNode : null,
    };
  };

  const handleMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Hover cursor when no gesture in progress
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
        // Promote the gesture to a node drag — pin its position
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
      // Drag node
      const node = dragRef.current.node;
      node.fx = node.x + dx / transformRef.current.k;
      node.fy = node.y + dy / transformRef.current.k;
    } else {
      // Pan camera
      transformRef.current.x += dx;
      transformRef.current.y += dy;
    }

    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;
  };

  const handleEnd = () => {
    const { node, hasMoved, isDragging } = dragRef.current;
    if (!isDragging) return;

    if (!hasMoved && node) {
      // Treat as a click — select the node and leave it free to re-layout
      onSelectNode(node);
    }
    if (hasMoved && node) {
      // Drag ended — release the pin so the node can be re-laid-out next time
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

  // Zooming
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 1.2;

  const applyZoom = (factor) => {
    const next = transformRef.current.k * factor;
    transformRef.current.k = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  };

  // React synthetic wheel events are passive by default, so preventDefault
  // is silently ignored and the page scrolls past the canvas. Attach a
  // native non-passive listener so zoom always captures the wheel.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onNativeWheel = (e) => {
      e.preventDefault();
      applyZoom(e.deltaY < 0 ? 1.08 : 1 / 1.08);
    };
    canvas.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onNativeWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const legendItems = [
    { label: 'You', color: COLORS.you, dim: false },
    { label: 'Connector', color: COLORS.connector, dim: false },
    { label: 'New', color: COLORS.new, dim: false },
    { label: 'Pending', color: COLORS.awaiting, dim: true },
    { label: 'Potential', color: COLORS.target, dim: true },
  ];

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

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={960}
        height={420}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{
          width: '100%',
          height: '420px',
          background: '#fcfbfa',
          border: '1.5px solid var(--border)',
          borderRadius: '4px',
          cursor: 'grab',
          touchAction: 'none',
          display: 'block',
        }}
      />

      {/* Zoom controls */}
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

      {/* Detail panel for selected Target node path */}
      {selectedNode?.type === 'target' && selectedNode.pathData && (
        <div 
          style={{ 
            marginTop: '1.25rem', 
            background: 'var(--white)', 
            border: '1.5px solid var(--border)',
            borderRadius: '4px',
            padding: '1.25rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--dark)', fontWeight: 500 }}>
                Trace Path to: {selectedNode.fullName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#7a6f68', margin: '0.25rem 0' }}>
                {selectedNode.role}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warm)', fontWeight: 600 }}>
                💡 Connection Path: You → {selectedNode.pathData.connector.name} → {selectedNode.fullName}
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = `/paths?intent=${selectedNode.pathData.intent_category}`}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Request Intro →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
