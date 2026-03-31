'use client';

import { useState, useRef } from 'react';

interface UsersTabProps {
  allUsers: Array<{ id: string; username: string; nickname: string | null; phone: string; role: string; slot_count: number; parent_id: string | null; domain: string | null; header_template: string | null; created_at: string }>;
  usersLoading: boolean;
  fetchAllUsers: () => void;
}

export default function UsersTab({ allUsers, usersLoading, fetchAllUsers }: UsersTabProps) {
  const [templateModal, setTemplateModal] = useState<{ userId: string; username: string; template: string } | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !templateModal) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = templateModal.template;
    const newText = current.substring(0, start) + variable + current.substring(end);
    setTemplateModal({ ...templateModal, template: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  const saveTemplate = async () => {
    if (!templateModal) return;
    setTemplateSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: templateModal.userId, headerTemplate: templateModal.template }),
    });
    setTemplateSaving(false);
    if (res.ok) {
      fetchAllUsers();
      setTemplateModal(null);
    } else {
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  const previewTemplate = (template: string) => {
    return template
      .replace(/\{가게명\}/g, '도파민')
      .replace(/\{날짜\}/g, '03월 31일 (월)')
      .replace(/\{아가씨이름\}/g, '마요');
  };

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6">회원 관리</h2>
      {usersLoading ? (
        <div className="text-center py-12 text-neutral-400">로딩 중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">아이디</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">담당자 닉네임</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">전화번호</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">등급</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">소속 총판</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">도메인</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">등록 가능 인원</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">가입일</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="px-4 py-3 text-white">{u.username}</td>
                  <td className="px-4 py-3 text-neutral-400">{u.nickname || '-'}</td>
                  <td className="px-4 py-3 text-neutral-400">{u.phone || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        const res = await fetch('/api/admin/users', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: u.id, role: newRole }),
                        });
                        if (res.ok) {
                          fetchAllUsers();
                        } else {
                          alert('역할 변경에 실패했습니다.');
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-full border-0 cursor-pointer focus:outline-none ${
                        u.role === 'superadmin'
                          ? 'bg-purple-600/20 text-purple-400'
                          : u.role === 'admin'
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      <option value="user">일반회원</option>
                      <option value="admin">총판</option>
                      <option value="superadmin">슈퍼관리자</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={u.parent_id || ''}
                      onChange={async (e) => {
                        const parentId = e.target.value || null;
                        const res = await fetch('/api/admin/users', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: u.id, parentId }),
                        });
                        if (res.ok) {
                          fetchAllUsers();
                        } else {
                          alert('총판 배정에 실패했습니다.');
                        }
                      }}
                      className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded border border-neutral-700 cursor-pointer focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">없음</option>
                      {allUsers.filter(au => au.role === 'admin').map(admin => (
                        <option key={admin.id} value={admin.id}>{admin.username}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    <div className="flex items-center gap-1">
                      <span className="text-sm truncate max-w-[160px]">{u.domain || '-'}</span>
                      <button
                        onClick={async () => {
                          const newDomain = prompt('도메인 주소를 입력하세요 (예: example.com):', u.domain || '');
                          if (newDomain !== null) {
                            const res = await fetch('/api/admin/users', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: u.id, domain: newDomain.trim() }),
                            });
                            if (res.ok) {
                              fetchAllUsers();
                            } else {
                              alert('도메인 수정에 실패했습니다.');
                            }
                          }
                        }}
                        className="px-1.5 py-0.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-400 rounded transition"
                      >
                        수정
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400">{u.slot_count}명</td>
                  <td className="px-4 py-3 text-center text-neutral-500 text-sm">
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={async () => {
                          const newCount = prompt('새로운 등록 가능 인원 수를 입력하세요:', String(u.slot_count));
                          if (newCount && !isNaN(Number(newCount))) {
                            const res = await fetch('/api/admin/users', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: u.id, slotCount: Number(newCount) }),
                            });
                            if (res.ok) {
                              fetchAllUsers();
                            } else {
                              alert('수정에 실패했습니다.');
                            }
                          }
                        }}
                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                      >
                        인원수정
                      </button>
                      <button
                        onClick={() => setTemplateModal({ userId: u.id, username: u.username, template: u.header_template || '' })}
                        className={`px-3 py-1 text-xs rounded transition ${
                          u.header_template
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                        }`}
                      >
                        헤더
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allUsers.length === 0 && (
            <div className="text-center py-12 text-neutral-600">
              회원이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 헤더 템플릿 편집 모달 */}
      {templateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setTemplateModal(null)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">헤더 템플릿 - {templateModal.username}</h3>

            {/* 변수 삽입 버튼 */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => insertVariable('{가게명}')} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                {'{가게명}'}
              </button>
              <button onClick={() => insertVariable('{날짜}')} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition">
                {'{날짜}'}
              </button>
              <button onClick={() => insertVariable('{아가씨이름}')} className="px-3 py-1.5 text-xs bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition">
                {'{아가씨이름}'}
              </button>
            </div>

            {/* 템플릿 입력 */}
            <textarea
              ref={textareaRef}
              value={templateModal.template}
              onChange={(e) => setTemplateModal({ ...templateModal, template: e.target.value })}
              placeholder="헤더 템플릿을 입력하세요..."
              rows={5}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />

            {/* 미리보기 */}
            {templateModal.template && (
              <div className="mt-3">
                <span className="text-xs text-neutral-500 mb-1 block">미리보기</span>
                <div className="bg-neutral-800 rounded-lg p-3 text-sm text-white whitespace-pre-wrap">
                  {previewTemplate(templateModal.template)}
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setTemplateModal(null)}
                className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={saveTemplate}
                disabled={templateSaving}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {templateSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
