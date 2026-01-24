class NamirezSystem {
  constructor() {
    this.config = {
      apiMembers: "names.json",
      apiGallery: "gallery.json",
      defaultImage: "images/default.png",
      debounceTime: 300,
      loaderDelay: 1000,
    };

    this.state = {
      members: [],
      gallery: [],
      debounceTimer: null,
    };

    this.dom = {
      loader: document.getElementById("page-loader"),
      body: document.body,
      // List Page Elements
      searchInput: document.getElementById("searchInput"),
      resultDiv: document.getElementById("results"),
      matchCount: document.getElementById("matchCount"),
      totalCount: document.getElementById("totalCount"),
      backToTopBtn: document.getElementById("backToTop"),
      // Gallery Page Elements
      galleryGrid: document.getElementById("gallery-grid"),
      imageViewer: document.getElementById("image-viewer"),
      fullImage: document.getElementById("full-image"),
      caption: document.getElementById("caption"),
      closeBtn: document.querySelector(".close-btn"),
    };
  }

  init() {
    console.clear();
    console.log(
      "%c NAMIREZ SYSTEM %c ONLINE ",
      "background: #fff; color: #000; font-size: 16px; font-weight: bold; padding: 5px;",
      "background: #000; color: #fff; font-size: 16px; font-weight: bold; padding: 5px;"
    );

    this.handleGlobalEvents();
    this.initParticleEffect();

    if (this.dom.resultDiv) {
      this.loadMembers();
      this.setupSearch();
    } else if (this.dom.galleryGrid) {
      this.loadGallery();
      this.setupLightbox();
    } else {
      this.hideLoader();
    }
  }

  async loadMembers() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const response = await fetch(this.config.apiMembers);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      this.state.members = data;
      this.updateStats(this.state.members.length, this.state.members.length);
      this.renderMembers(this.state.members);
    } catch (error) {
      console.error("Member Error:", error);
      this.renderError(this.dom.resultDiv);
    } finally {
      this.hideLoader();
    }
  }

  renderMembers(list) {
    if (!this.dom.resultDiv) return;
    this.dom.resultDiv.innerHTML = "";

    if (list.length === 0) {
      this.dom.resultDiv.innerHTML = `
        <div class="loading-wrapper">
          <p style="color: var(--text-muted); font-size: 1.5rem; letter-spacing: 3px;">NO TARGET FOUND</p>
        </div>`;
      return;
    }

    const ul = document.createElement("ul");
    const fragment = document.createDocumentFragment();

    list.forEach((person, index) => {
      const card = document.createElement("li");
      card.className = "card";
      card.style.opacity = "0";
      card.style.animation = `fadeInMove 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards ${index * 0.05}s`;

      const imagePath = person.image || this.config.defaultImage;
      const rank = person.rank || "MEMBER";

      let socialHtml = "";
      if (person.facebook) socialHtml += `<a href="${person.facebook}" target="_blank" class="social-btn fb"><i class="fab fa-facebook-f"></i></a>`;
      if (person.instagram) socialHtml += `<a href="${person.instagram}" target="_blank" class="social-btn ig"><i class="fab fa-instagram"></i></a>`;
      if (person.youtube) socialHtml += `<a href="${person.youtube}" target="_blank" class="social-btn yt"><i class="fab fa-youtube"></i></a>`;
      if (person.tiktok) socialHtml += `<a href="${person.tiktok}" target="_blank" class="social-btn tt"><i class="fab fa-tiktok"></i></a>`;

      card.innerHTML = `
        <img src="${imagePath}" class="card-bg-img" loading="lazy">
        <div class="card-overlay"></div>
        <div class="info-layer">
          <span class="rank-tag">${rank}</span>
          <span class="name-text">${person.name}</span>
          <div class="social-actions">${socialHtml}</div>
        </div>
      `;

      const img = card.querySelector("img");
      img.onerror = () => { img.src = this.config.defaultImage; };

      fragment.appendChild(card);
    });

    ul.appendChild(fragment);
    this.dom.resultDiv.appendChild(ul);
  }

  updateStats(match, total) {
    if (this.dom.matchCount) this.dom.matchCount.textContent = match;
    if (this.dom.totalCount) this.dom.totalCount.textContent = total;
  }

  setupSearch() {
    if (!this.dom.searchInput) return;
    this.dom.searchInput.addEventListener("input", (e) => {
      clearTimeout(this.state.debounceTimer);
      this.state.debounceTimer = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        const filtered = query
          ? this.state.members.filter((m) => m.name.toLowerCase().includes(query))
          : this.state.members;
        this.renderMembers(filtered);
        this.updateStats(filtered.length, this.state.members.length);
      }, this.config.debounceTime);
    });
  }

  async loadGallery() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const response = await fetch(this.config.apiGallery);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      this.state.gallery = data;
      this.renderGallery(data);
    } catch (error) {
      console.error("Gallery Error:", error);
      this.dom.galleryGrid.innerHTML = `<p style="color: #fff; text-align: center;">GALLERY NOT FOUND</p>`;
    } finally {
      this.hideLoader();
    }
  }

  renderGallery(list) {
    if (!this.dom.galleryGrid) return;
    this.dom.galleryGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    list.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.style.opacity = "0";
      div.style.animation = `fadeInMove 0.6s forwards ${index * 0.1}s`;

      const isVideo = !!item.video;
      
      let imageSrc = item.image;
      if (!imageSrc && isVideo) {
        const ytID = this.getYouTubeID(item.video);
        if (ytID) {
          imageSrc = `https://img.youtube.com/vi/${ytID}/maxresdefault.jpg`;
        } else {
          imageSrc = this.config.defaultImage;
        }
      }

      let htmlContent = `<img src="${imageSrc}" alt="${item.caption}" loading="lazy">`;
      if (isVideo) {
        htmlContent += `<div class="play-icon"><i class="fa-solid fa-play"></i></div>`;
        div.setAttribute("data-video", item.video);
      }

      htmlContent += `
        <div class="gallery-overlay">
            <h3>${item.caption}</h3>
        </div>
      `;

      div.innerHTML = htmlContent;

      div.addEventListener("click", () => {
        if (isVideo) {
          window.open(item.video, '_blank');
        } else {
          this.openLightbox(imageSrc, item.caption);
        }
      });

      fragment.appendChild(div);
    });

    this.dom.galleryGrid.appendChild(fragment);
  }

  getYouTubeID(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  setupLightbox() {
    if (!this.dom.imageViewer) return;
    
    this.dom.closeBtn.onclick = () => this.closeLightbox();
    this.dom.imageViewer.onclick = (e) => {
      if(e.target === this.dom.imageViewer) this.closeLightbox();
    };
  }

  openLightbox(src, caption) {
    this.dom.imageViewer.style.display = "flex";
    setTimeout(() => { this.dom.imageViewer.classList.add('active'); }, 10);
    this.dom.fullImage.src = src;
    this.dom.caption.innerHTML = caption;
  }

  closeLightbox() {
    this.dom.imageViewer.classList.remove('active');
    setTimeout(() => { this.dom.imageViewer.style.display = "none"; }, 300);
  }

  renderError(container) {
    if (container) {
      container.innerHTML = `
        <div class="loading-wrapper">
          <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent); font-size: 3rem; margin-bottom: 20px;"></i>
          <p style="color: var(--accent); font-size: 1.5rem;">CONNECTION FAILED</p>
        </div>`;
    }
  }

  handleGlobalEvents() {
    // Mouse tracking for gradient effect
    document.addEventListener("mousemove", (e) => {
      const cards = document.querySelectorAll(".nav-card, .card");
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    });

    window.addEventListener("scroll", () => {
      if (this.dom.backToTopBtn) {
        if (window.scrollY > 300) this.dom.backToTopBtn.classList.add("show");
        else this.dom.backToTopBtn.classList.remove("show");
      }
    });

    if (!document.getElementById("dynamic-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "dynamic-styles";
      styleSheet.innerText = `
        @keyframes fadeInMove {
            from { opacity: 0; transform: translateY(30px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        `;
      document.head.appendChild(styleSheet);
    }
  }

  hideLoader() {
    if (this.dom.loader) {
      setTimeout(() => {
        this.dom.loader.classList.add("hidden");
      }, this.config.loaderDelay);
    }
  }

  initParticleEffect() {
    const container = document.getElementById("particles-container");
    if (!container) return;

    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      this.createParticle(container);
    }
  }

  createParticle(container) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    const size = Math.random() * 3 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    
    const duration = Math.random() * 20 + 10;
    particle.style.transition = `all ${duration}s linear, opacity 2s ease`;
    
    container.appendChild(particle);

    // Animate
    setTimeout(() => {
      particle.style.opacity = Math.random() * 0.3 + 0.1;
      this.moveParticle(particle);
    }, 100);
  }

  moveParticle(particle) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    particle.style.left = `${x}vw`;
    particle.style.top = `${y}vh`;
    
    const duration = Math.random() * 20 + 10;
    
    setTimeout(() => {
      this.moveParticle(particle);
    }, duration * 1000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new NamirezSystem();
  app.init();
});