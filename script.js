const starsContainer = document.getElementById('stars');
const scene = document.getElementById('scene');

function createStar(x = Math.random() * window.innerWidth, y = Math.random() * window.innerHeight) {
  const star = document.createElement('span');
  star.className = 'star';

  const size = Math.random() * 2.3 + 0.6;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.left = `${x}px`;
  star.style.top = `${y}px`;
  star.style.setProperty('--twinkle-speed', `${Math.random() * 3 + 2.5}s`);

  starsContainer.appendChild(star);
}

function fillInitialStars(total = 170) {
  starsContainer.innerHTML = '';
  for (let i = 0; i < total; i += 1) {
    createStar();
  }
}

function burstParticles(x, y, total = 18) {
  for (let i = 0; i < total; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'star-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    const angle = (Math.PI * 2 * i) / total;
    const dist = 20 + Math.random() * 70;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    scene.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

function handleInteraction(event) {
  const point = event.touches ? event.touches[0] : event;
  const x = point.clientX;
  const y = point.clientY;

  for (let i = 0; i < 15; i += 1) {
    createStar(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120);
  }

  burstParticles(x, y);
}

window.addEventListener('resize', () => fillInitialStars());
scene.addEventListener('click', handleInteraction);
scene.addEventListener('touchstart', handleInteraction, { passive: true });

fillInitialStars();
