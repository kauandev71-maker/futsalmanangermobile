// ============================================================
// FUTSAL MANAGER - DRAG & DROP v3
// Arrasta jogadores da lista para posições específicas na quadra
// ============================================================

function initDragDrop(gs, ui) {
  let draggedPid      = null;
  let draggedFromSlot = null;

  // ── BENCH: jogadores da lista draggable ──────────────────
  document.querySelectorAll('#tac-bench .tac-player-row[draggable]').forEach(el => {
    el.addEventListener('dragstart', e => {
      draggedPid = el.dataset.pid;
      draggedFromSlot = null;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedPid);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });

  // ── COURT: jogadores já colocados na quadra ───────────────
  document.querySelectorAll('#futsal-court .court-slot-v2.filled [draggable]').forEach(el => {
    el.addEventListener('dragstart', e => {
      draggedPid = el.dataset.pid;
      draggedFromSlot = el.dataset.fromslot !== undefined ? parseInt(el.dataset.fromslot) : null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedPid);
      e.stopPropagation();
    });
  });

  // ── DROP: slots na quadra ─────────────────────────────────
  // Usamos querySelectorAll em toda a quadra e subimos com .closest para achar o slot
  const court = document.getElementById('futsal-court');
  if (court) {
    court.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const slot = e.target.closest('.court-slot-v2');
      if (slot) slot.classList.add('drag-over');
    });

    court.addEventListener('dragleave', e => {
      const slot = e.target.closest('.court-slot-v2');
      if (slot && !slot.contains(e.relatedTarget)) slot.classList.remove('drag-over');
    });

    court.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      // Remove highlights
      document.querySelectorAll('.court-slot-v2.drag-over').forEach(s => s.classList.remove('drag-over'));
      const slot = e.target.closest('.court-slot-v2');
      if (!slot) return;
      const slotIdx = parseInt(slot.dataset.slot);
      if (isNaN(slotIdx)) return;
      const pid = e.dataTransfer.getData('text/plain') || draggedPid;
      if (!pid) return;
      // Guard: não permite escalar jogador lesionado
      const player = window.gameState?.players?.[pid];
      if (player && player.injured) {
        if (window.ui) window.ui.showToast(`${player.name} está lesionado!`, 'warn');
        draggedPid = null; draggedFromSlot = null; return;
      }
      ui.tacPlaceInSlot(pid, slotIdx);
      draggedPid = null;
      draggedFromSlot = null;
    });
  }

  // ── DROP: banco (remove da quadra) ────────────────────────
  const bench = document.getElementById('tac-bench');
  if (bench) {
    bench.addEventListener('dragover', e => {
      e.preventDefault();
      bench.classList.add('bench-drag-target');
    });
    bench.addEventListener('dragleave', e => {
      if (!bench.contains(e.relatedTarget)) bench.classList.remove('bench-drag-target');
    });
    bench.addEventListener('drop', e => {
      e.preventDefault();
      bench.classList.remove('bench-drag-target');
      const pid = e.dataTransfer.getData('text/plain') || draggedPid;
      if (!pid) return;
      if (draggedFromSlot !== null) ui.tacRemoveSlot(draggedFromSlot);
      draggedPid = null;
      draggedFromSlot = null;
    });
  }
}

window.initDragDrop = initDragDrop;
console.log('✅ dragdrop.js v3 carregado');
