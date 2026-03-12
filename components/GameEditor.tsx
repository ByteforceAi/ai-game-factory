'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[440px] flex items-center justify-center bg-black/40 border border-cyber-cyan/10 rounded-lg">
      <div className="text-cyber-text/30 font-mono text-sm">에디터 로딩 중...</div>
    </div>
  ),
});

interface GameEditorProps {
  code: string;
  onApply: (code: string) => void;
}

export default function GameEditor({ code, onApply }: GameEditorProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedCode(value);
      setHasChanges(value !== code);
    }
  };

  const handleApply = () => {
    onApply(editedCode);
    setHasChanges(false);
  };

  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-cyber-cyan/10">
        <MonacoEditor
          height="440px"
          language="html"
          theme="vs-dark"
          value={editedCode}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbers: 'on',
            renderWhitespace: 'none',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
      {hasChanges && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleApply}
            className="px-6 py-2.5 btn-neon text-[12px]"
          >
            ✓ 적용하기
          </button>
        </div>
      )}
    </div>
  );
}
