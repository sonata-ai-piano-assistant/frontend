// Fetch a .mid file by song name from the backend music API
// Example usage: await fetchMidiFileBySongName("ABC Song")

import { BDD_SERVICE_URL } from "../config/service-urls"

/**
 * Converts a song name to a file name (e.g., "ABC Song" -> "abc-song")
 */
function songNameToFileName(songName: string): string {
  return songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Fetches a .mid file as a Blob by song name
 * @param songName The human-readable song name (e.g., "ABC Song")
 * @returns Promise<Blob> (MIDI file data)
 */
export async function fetchMidiFileBySongName(songName: string): Promise<Blob> {
  const fileName = songNameToFileName(songName)
  const url = `${BDD_SERVICE_URL}/api/music/${fileName}` // Adjust base URL if needed
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch MIDI file: ${response.statusText}`)
  }
  return await response.blob()
}
