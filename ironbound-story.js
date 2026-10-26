(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const dialog = byId('process-dialog');
  const openButton = byId('process-open');
  const closeButton = byId('process-close');
  const comparison = byId('process-comparison');
  const split = byId('process-split');
  const gold = byId('process-gold');
  const silver = byId('process-silver');
  const rewind = byId('process-rewind');
  const timeline = byId('process-timeline');
  const previous = byId('process-prev');
  const next = byId('process-next');
  const steps = [...byId('process-steps').querySelectorAll('[data-iteration]')];
  let current = 4;
  let exploring = false;
  let previousFocus;

  function source(index, metal) {
    return `assets/ironbound-iteration-${String(index + 1).padStart(2, '0')}-${metal}.webp`;
  }

  function setSplit(value) {
    const percentage = Math.max(0, Math.min(100, Number(value)));
    comparison.style.setProperty('--split', `${percentage}%`);
    split.value = String(percentage);
    split.setAttribute('aria-valuetext', `${percentage}% gold, ${100 - percentage}% silver`);
  }

  function selectIteration(index) {
    current = Math.max(0, Math.min(4, index));
    const label = current === 4 ? 'Final result' : `Iteration ${String(current + 1).padStart(2, '0')}`;
    gold.src = source(current, 'gold');
    silver.src = source(current, 'silver');
    gold.alt = `${label} of HXH UI in gold`;
    silver.alt = `${label} of HXH UI in silver`;
    byId('process-phase').textContent = label;
    byId('process-status').textContent = `${label}. ${current + 1} of 5.`;
    previous.disabled = current === 0;
    next.disabled = current === 4;
    steps.forEach((step, index) => {
      if (index === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  function open() {
    previousFocus = document.activeElement;
    exploring = false;
    timeline.hidden = true;
    rewind.hidden = false;
    rewind.setAttribute('aria-expanded', 'false');
    selectIteration(4);
    dialog.showModal();
    closeButton.focus();
    // Only fetch the earlier artwork when a visitor opens the process.
    for (let index = 0; index < 4; index += 1) {
      for (const metal of ['gold', 'silver']) {
        const preload = new Image();
        preload.src = source(index, metal);
      }
    }
  }

  function close() {
    dialog.close();
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  split.addEventListener('input', event => setSplit(event.target.value));
  rewind.addEventListener('click', () => {
    exploring = true;
    timeline.hidden = false;
    rewind.hidden = true;
    rewind.setAttribute('aria-expanded', 'true');
    selectIteration(0);
    steps[0].focus();
  });
  previous.addEventListener('click', () => selectIteration(current - 1));
  next.addEventListener('click', () => selectIteration(current + 1));
  steps.forEach(step => step.addEventListener('click', () => selectIteration(Number(step.dataset.iteration))));
  dialog.addEventListener('keydown', event => {
    // The range retains its native keyboard controls for comparing metals.
    if (!exploring || event.target === split || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : current + (event.key === 'ArrowRight' ? 1 : -1);
    selectIteration(index);
    steps[current].focus();
  });
  setSplit(50);
})();
