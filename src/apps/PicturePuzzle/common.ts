export const puzzle_size = 4;
export const board_size = 520;
export const tile_size = board_size / puzzle_size;
export const grid_label = `${puzzle_size} x ${puzzle_size}`;

const image_modules = import.meta.glob("./assets/png/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const image_candidates = Object.values(image_modules);

export const createSolvedBoard = () => Array.from({ length: puzzle_size * puzzle_size }, (_, index) => index);

export const pickRandomImage = (current_image?: string) => {
  if (image_candidates.length === 0) {
    return "";
  }

  if (image_candidates.length === 1) {
    return image_candidates[0]!;
  }

  let next_image = current_image ?? "";

  while (!next_image || next_image === current_image) {
    next_image = image_candidates[Math.floor(Math.random() * image_candidates.length)]!;
  }

  return next_image;
};

export const createTileStyle = (tile: number, image_url: string) => {
  const row = Math.floor(tile / puzzle_size);
  const column = tile % puzzle_size;

  return {
    backgroundImage: `url(${image_url})`,
    backgroundSize: `${board_size}px ${board_size}px`,
    backgroundPosition: `-${column * tile_size}px -${row * tile_size}px`,
  };
};