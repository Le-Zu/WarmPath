// Warm Score visual — 5 flames in a row, fill the first N. Each position has
// a fixed color and a fixed size, escalating left→right so higher scores read
// as physically bigger and brighter. Color logic: red = weakest (1), yellow =
// strongest (5). Empty positions render as solid muted gray flames (no outline).

const SCORE_COLORS = {
  1: '#B11D1D', // deep red (weakest)
  2: '#D8421B', // orange-red
  3: '#E87722', // orange
  4: '#F39C2A', // yellow-orange
  5: '#F5C518', // yellow (strongest)
};

const FLAME_SIZES = {
  1: 24,
  2: 28,
  3: 32,
  4: 36,
  5: 40,
};

const EMPTY_FLAME_FILL = '#d8cfc7';

// Inject CSS styles for the staggered flame bounce animation
if (typeof document !== 'undefined' && !document.getElementById('wp-flame-styles')) {
  const s = document.createElement('style');
  s.id = 'wp-flame-styles';
  s.textContent = `
    @keyframes wp-flame-bounce-1 {
      0% { transform: translateY(0) scale(0.85); opacity: 0; }
      40% { transform: translateY(-10px) scale(1.1); opacity: 1; }
      100% { transform: translateY(-2px) scale(1); opacity: 1; }
    }
    @keyframes wp-flame-bounce-2 {
      0% { transform: translateY(0) scale(0.85); opacity: 0; }
      40% { transform: translateY(-16px) scale(1.1); opacity: 1; }
      100% { transform: translateY(-6px) scale(1); opacity: 1; }
    }
    @keyframes wp-flame-bounce-3 {
      0% { transform: translateY(0) scale(0.85); opacity: 0; }
      40% { transform: translateY(-22px) scale(1.1); opacity: 1; }
      100% { transform: translateY(-10px) scale(1); opacity: 1; }
    }
    @keyframes wp-flame-bounce-4 {
      0% { transform: translateY(0) scale(0.85); opacity: 0; }
      40% { transform: translateY(-28px) scale(1.1); opacity: 1; }
      100% { transform: translateY(-14px) scale(1); opacity: 1; }
    }
    @keyframes wp-flame-bounce-5 {
      0% { transform: translateY(0) scale(0.85); opacity: 0; }
      40% { transform: translateY(-34px) scale(1.1); opacity: 1; }
      100% { transform: translateY(-18px) scale(1); opacity: 1; }
    }
    .wp-flame-item {
      opacity: 0;
    }
  `;
  document.head.appendChild(s);
}

function FlameSvg({ size, fill }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
        >
            <path
                d="M12 2.4c-.4 0-.7.2-.9.6-.5 1.2-1.4 2-2.3 2.9-1.5 1.4-3.3 3.2-3.3 6.5 0 4.1 3 7.2 6.5 7.2s6.5-3.1 6.5-7.2c0-2-.7-3.4-1.4-4.5-.4.6-1 1-1.7 1-1 0-1.8-.8-1.8-1.8 0-.6.3-1.1.7-1.5-.6-.7-1.1-1.5-1.4-2.6-.2-.4-.5-.6-.9-.6Zm0 9.6c1.3 0 2.4 1.1 2.4 2.5 0 1.4-1 2.7-2.4 2.7s-2.4-1.3-2.4-2.7c0-1.4 1.1-2.5 2.4-2.5Z"
                fill={fill}
                fillRule="evenodd"
            />
        </svg>
    );
}

export default function WarmthScore({ score }) {
    const numericScore = score ? Number(score) : 0;
    const isValid = Number.isInteger(numericScore) && numericScore >= 0 && numericScore <= 5;

    if (!isValid) {
        return (
            <div style={{ fontSize: '0.8rem', color: '#7a6f68' }}>
                {String(score || '')}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center', // Centers start leveled horizontally
                gap: '0.4rem',
                minHeight: '60px',
                paddingTop: '20px' // Provides vertical clearance for the bounce transformations
            }}
            aria-label={`Warm score ${numericScore} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((position) => {
                const filled = position <= numericScore;
                return (
                    <div
                        key={position}
                        className="wp-flame-item"
                        style={{
                            animation: `wp-flame-bounce-${position} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                            animationDelay: `${(position - 1) * 80}ms`,
                        }}
                    >
                        <FlameSvg
                            size={FLAME_SIZES[position]}
                            fill={filled ? SCORE_COLORS[position] : EMPTY_FLAME_FILL}
                        />
                    </div>
                );
            })}
        </div>
    );
}
