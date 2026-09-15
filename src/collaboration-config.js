// Set enabled:false, then build + sync to ship the original game without the artwork.
// Dates must include a timezone, e.g. '2026-10-01T00:00:00+09:00'. null = unrestricted.
export const collaboration={
  enabled:true,
  startsAt:null,
  endsAt:null,
  target:5,
  feverSeconds:10,
  spawnRate:.30,
  feverSpawnRate:.80,
};
