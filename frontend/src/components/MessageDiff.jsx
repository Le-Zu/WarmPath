/**
 * Visually compares an original message with an edited version.
 * Highlights new words added by the connector in a themed color.
 */
export default function MessageDiff({ original, edited }) {
  if (!edited || original === edited) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{edited || original}</span>;
  }

  // Naive word diff: check if each word in 'edited' was in 'original'
  const originalWords = new Set(original.split(/(\s+)/).map(w => w.trim()).filter(Boolean));
  const editedTokens = edited.split(/(\s+)/);

  return (
    <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
      {editedTokens.map((token, i) => {
        const trimmed = token.trim();
        if (!trimmed) return <span key={i}>{token}</span>;
        
        // If it's a new word not in the original draft, highlight it
        const isNew = !originalWords.has(trimmed);
        
        return (
          <span
            key={i}
            style={{
              color: isNew ? 'var(--warm)' : 'inherit',
              backgroundColor: isNew ? 'rgba(231, 111, 81, 0.08)' : 'transparent',
              padding: isNew ? '0 2px' : '0',
              borderRadius: isNew ? '2px' : '0',
              fontWeight: isNew ? 500 : 400,
            }}
          >
            {token}
          </span>
        );
      })}
    </div>
  );
}
