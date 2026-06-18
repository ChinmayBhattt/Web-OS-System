import { openDB, IDBPDatabase } from 'idb';
import { FSNode } from '@/types/fileSystem';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'WebOS_FileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('parentId', 'parentId', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      },
    });
  }
  return dbPromise;
}

export async function initializeFileSystem(): Promise<void> {
  const db = await getDB();
  const count = await db.count(STORE_NAME);
  if (count > 0) return;

  const now = Date.now();
  const rootId = 'root';
  const homeId = uuidv4();
  const userId = uuidv4();

  const defaultDirs: FSNode[] = [
    { id: rootId, name: '/', type: 'directory', parentId: null, size: 0, createdAt: now, modifiedAt: now },
    { id: homeId, name: 'home', type: 'directory', parentId: rootId, size: 0, createdAt: now, modifiedAt: now },
    { id: userId, name: 'user', type: 'directory', parentId: homeId, size: 0, createdAt: now, modifiedAt: now },
  ];

  const userFolders = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos'];
  const folderIds: Record<string, string> = {};

  for (const folder of userFolders) {
    const id = uuidv4();
    folderIds[folder] = id;
    defaultDirs.push({
      id, name: folder, type: 'directory', parentId: userId, size: 0, createdAt: now, modifiedAt: now,
    });
  }

  // Add sample files
  const sampleFiles: FSNode[] = [
    {
      id: uuidv4(), name: 'Welcome.txt', type: 'file', parentId: folderIds['Documents'],
      content: 'Welcome to WebOS!\n\nThis is your virtual operating system running entirely in your browser.\n\nFeel free to explore the file system, open applications, and customize your experience.\n\nEnjoy!',
      mimeType: 'text/plain', size: 180, createdAt: now, modifiedAt: now,
    },
    {
      id: uuidv4(), name: 'Notes.md', type: 'file', parentId: folderIds['Documents'],
      content: '# My Notes\n\n## Getting Started\n- Open the Terminal to run commands\n- Use File Explorer to browse files\n- Customize your theme in Settings\n\n## Tips\n- Drag windows by their title bar\n- Resize from edges and corners\n- Right-click the desktop for options',
      mimeType: 'text/markdown', size: 250, createdAt: now, modifiedAt: now,
    },
    {
      id: uuidv4(), name: 'hello.js', type: 'file', parentId: folderIds['Documents'],
      content: '// Hello from WebOS!\nfunction greet(name) {\n  console.log(`Hello, ${name}! Welcome to WebOS.`);\n}\n\ngreet("User");',
      mimeType: 'text/javascript', size: 130, createdAt: now, modifiedAt: now,
    },
    {
      id: uuidv4(), name: 'readme.txt', type: 'file', parentId: folderIds['Desktop'],
      content: 'Welcome to your Desktop!\nDouble-click icons to open applications.\nRight-click for more options.',
      mimeType: 'text/plain', size: 100, createdAt: now, modifiedAt: now,
    },
  ];

  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const node of [...defaultDirs, ...sampleFiles]) {
    await tx.store.add(node);
  }
  await tx.done;
}

export async function getNode(id: string): Promise<FSNode | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function getChildren(parentId: string): Promise<FSNode[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'parentId', parentId);
}

export async function getAllNodes(): Promise<FSNode[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function createNode(node: Omit<FSNode, 'id' | 'createdAt' | 'modifiedAt'>): Promise<FSNode> {
  const db = await getDB();
  const now = Date.now();
  const newNode: FSNode = {
    ...node,
    id: uuidv4(),
    createdAt: now,
    modifiedAt: now,
  };
  await db.add(STORE_NAME, newNode);
  return newNode;
}

export async function updateNode(id: string, updates: Partial<FSNode>): Promise<FSNode | undefined> {
  const db = await getDB();
  const node = await db.get(STORE_NAME, id);
  if (!node) return undefined;
  const updated = { ...node, ...updates, modifiedAt: Date.now() };
  await db.put(STORE_NAME, updated);
  return updated;
}

export async function deleteNode(id: string): Promise<void> {
  const db = await getDB();
  // Recursively delete children
  const children = await getChildren(id);
  for (const child of children) {
    await deleteNode(child.id);
  }
  await db.delete(STORE_NAME, id);
}

export async function moveNode(id: string, newParentId: string): Promise<FSNode | undefined> {
  return updateNode(id, { parentId: newParentId });
}

export async function resolvePath(path: string): Promise<FSNode | undefined> {
  const db = await getDB();
  const allNodes = await db.getAll(STORE_NAME);

  if (path === '/') {
    return allNodes.find(n => n.parentId === null && n.name === '/');
  }

  const segments = path.split('/').filter(Boolean);
  let current = allNodes.find(n => n.parentId === null && n.name === '/');
  if (!current) return undefined;

  for (const seg of segments) {
    const children = allNodes.filter(n => n.parentId === current!.id);
    current = children.find(c => c.name === seg);
    if (!current) return undefined;
  }

  return current;
}

export async function getNodePath(id: string): Promise<string> {
  const db = await getDB();
  const allNodes = await db.getAll(STORE_NAME);
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  const parts: string[] = [];
  let current = nodeMap.get(id);
  while (current && current.parentId !== null) {
    parts.unshift(current.name);
    current = nodeMap.get(current.parentId);
  }
  return '/' + parts.join('/');
}

export async function getStorageUsage(): Promise<{ used: number; total: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return { used: estimate.usage || 0, total: estimate.quota || 0 };
  }
  return { used: 0, total: 0 };
}
