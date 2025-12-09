'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Enter rules...' }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Update editor content when the content prop changes (e.g., when loading a template)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-2 border-zinc-700 rounded bg-zinc-800">
      {/* Toolbar */}
      <div className="border-b-2 border-zinc-700 p-2 flex flex-wrap gap-1 bg-zinc-900/50">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('bold') ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Bold"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('italic') ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Italic"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('underline') ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="size-4" />
        </button>

        <div className="w-px h-8 bg-zinc-700 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Heading 1"
        >
          <Heading1 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Heading 2"
        >
          <Heading2 className="size-4" />
        </button>

        <div className="w-px h-8 bg-zinc-700 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('bulletList') ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Bullet List"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive('orderedList') ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="size-4" />
        </button>

        <div className="w-px h-8 bg-zinc-700 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Align Left"
        >
          <AlignLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Align Center"
        >
          <AlignCenter className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-zinc-700 transition-colors ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-700 text-amber-400' : 'text-zinc-400'
          }`}
          title="Align Right"
        >
          <AlignRight className="size-4" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
