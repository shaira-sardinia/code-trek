export const TILE_SIZE = 48;

export interface TilePosition {
  col: number;
  row: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export function tileToPixel(pos: TilePosition): PixelPosition {
  return {
    x: pos.col * TILE_SIZE + TILE_SIZE / 2,
    y: pos.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function pixelToTile(pos: PixelPosition): TilePosition {
  return {
    col: Math.floor(pos.x / TILE_SIZE),
    row: Math.floor(pos.y / TILE_SIZE),
  };
}
