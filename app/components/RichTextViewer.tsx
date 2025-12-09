'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

interface RichTextViewerProps {
  content: string;
}

export default function RichTextViewer({ content }: RichTextViewerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-viewer">
      <EditorContent editor={editor} />
    </div>
  );
}
