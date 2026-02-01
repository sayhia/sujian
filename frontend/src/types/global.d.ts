export interface Window {
  wails?: {
    handlers?: {
      NoteHandler?: {
        Create(title: string, content: string, tags: string[]): Promise<any>;
        GetAll(limit: number, offset: number, tags: string[], archived: boolean): Promise<any>;
        GetByID(id: number): Promise<any>;
        Update(id: number, title?: string, content?: string, tags?: string[]): Promise<any>;
        Delete(id: number): Promise<void>;
        Archive(id: number, archive: boolean): Promise<void>;
      };
    };
  };
  go?: {
    handlers?: {
      NoteHandler?: {
        Create(title: string, content: string, tags: string[]): Promise<any>;
        GetAll(limit: number, offset: number, tags: string[], archived: boolean): Promise<any>;
        GetByID(id: number): Promise<any>;
        Update(id: number, title?: string, content?: string, tags?: string[]): Promise<any>;
        Delete(id: number): Promise<void>;
        Archive(id: number, archive: boolean): Promise<void>;
      };
    };
  };
}

declare const window: Window;
