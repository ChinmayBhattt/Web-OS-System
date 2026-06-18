export interface FSNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  parentId: string | null;
  content?: string;
  mimeType?: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
  icon?: string;
}

export interface FSPath {
  segments: string[];
  toString(): string;
}
