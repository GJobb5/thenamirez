class NamirezSystem {
  constructor() {
    this.config = {
      apiMembers: "names.json",
      apiGallery: "gallery.json",
      defaultImage: "images/default.png",
      debounceTime: 300,
      loaderDelay: 800,
    };

    this.state = {
      members: [],
      gallery: [],
      debounceTimer: null,
    };

    this.dom = {
      loader: document.getElementById("page-loader"),
      body: document.body,

      // Elements หน้ารายชื่อ
      searchInput: document.getElementById("searchInput"),
      resultDiv: document.getElementById("results"),
      matchCount: document.getElementById("matchCount"),
      totalCount: document.getElementById("totalCount"),
      backToTopBtn: document.getElementById("backToTop"),

      // Elements หน้า Gallery
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
    this.initSnowEffect();

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
      await new Promise((resolve) => setTimeout(resolve, 600));
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
          <p style="color: #555; font-size: 1.5rem; letter-spacing: 3px;">NO TARGET FOUND</p>
        </div>`;
      return;
    }

    const ul = document.createElement("ul");
    const fragment = document.createDocumentFragment();

    list.forEach((person, index) => {
      const card = document.createElement("li");
      card.className = "card";
      card.style.opacity = "0";
      card.style.animation = `fadeInMove 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards ${index * 0.05}s`;

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
      await new Promise((resolve) => setTimeout(resolve, 600));
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
      div.style.animation = `fadeInMove 0.5s forwards ${index * 0.1}s`;

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
        div.setAttribute("data-video", item.video); // ฝังลิงก์ไว้ที่ element
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

  initSnowEffect() {
    if (document.querySelector(".snow-generated")) return;
    let snowContainer = document.querySelector(".snow-container");
    if (!snowContainer) {
      snowContainer = document.createElement("div");
      snowContainer.className = "snow-container snow-generated";
      document.body.prepend(snowContainer);
    } else {
      snowContainer.classList.add("snow-generated");
    }

    const createSnowflake = () => {
      const snowflake = document.createElement("div");
      snowflake.classList.add("snowflake");
      snowflake.innerText = "❄";
      snowflake.style.left = Math.random() * 100 + "vw";
      snowflake.style.fontSize = Math.random() * 10 + 10 + "px";
      snowflake.style.opacity = Math.random() * 0.5 + 0.3;
      const duration = Math.random() * 5 + 3;
      snowflake.style.animationDuration = duration + "s";
      this.dom.body.appendChild(snowflake);
      setTimeout(() => { snowflake.remove(); }, duration * 1000);
    };
    setInterval(createSnowflake, 400);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new NamirezSystem();
  app.init();
});