// utils/chunker.ts
export function splitIntoChunks(
  text: string,
  chunkSize: number = 500
): string[] {
  // Clean and normalize the text
  const cleanedText = text.replace(/\s+/g, " ").trim();

  const words = cleanedText.split(" ");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    // Approximate token count (rough estimation)
    const wordTokens = Math.ceil(word.length / 4);

    if (currentLength + wordTokens > chunkSize && currentChunk.length > 0) {
      // Add the current chunk to chunks array
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(word);
    currentLength += wordTokens;
  }

  // Add the last chunk if it exists
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  // Post-process chunks to ensure they maintain context
  return chunks.map((chunk, index) => {
    // Add overlap with previous chunk if available
    if (index > 0) {
      const previousChunkWords = chunks[index - 1].split(" ").slice(-50);
      chunk = previousChunkWords.join(" ") + " " + chunk;
    }
    return chunk;
  });
}
