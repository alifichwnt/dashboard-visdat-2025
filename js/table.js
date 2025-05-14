// === KONFIGURASI ===
const rowsPerPage = 8; // Jumlah baris per halaman

// === FUNGSI RENDER TABEL ===
function renderTable({
  data,
  tableId,
  searchId,
  paginationId,
  columnToggleId,
  prioritizeColumn = null,
}) {
  let currentPage = 1;
  let filteredData = [...data];
  let sortState = {};
  let visibleColumns = Object.keys(data[0]);

  if (prioritizeColumn) {
    visibleColumns = [
      prioritizeColumn,
      ...visibleColumns.filter((k) => k !== prioritizeColumn),
    ];
  }

  const table = document.getElementById(tableId);
  const searchInput = document.getElementById(searchId);
  const paginationContainer = document.getElementById(paginationId);
  const columnToggleContainer = document.getElementById(columnToggleId);

  // === RENDER HEADER CHECKLIST ===
  function renderColumnToggle() {
    columnToggleContainer.innerHTML = "";

    // === Buat checkbox 'Semua' ===
    const allLabel = document.createElement("label");
    const allCb = document.createElement("input");
    allCb.type = "checkbox";
    allCb.value = "ALL";
    allCb.checked = true;
    allCb.id = `${columnToggleId}-all`;
    allCb.addEventListener("change", () => {
      const allChecked = allCb.checked;
      [
        ...columnToggleContainer.querySelectorAll("input[type=checkbox]"),
      ].forEach((cb) => {
        if (cb.value !== "ALL") cb.checked = allChecked;
      });
      render();
    });
    allLabel.appendChild(allCb);
    allLabel.append(" Semua");
    columnToggleContainer.appendChild(allLabel);

    // === Checklist tiap kolom ===
    visibleColumns.forEach((col) => {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = col;
      cb.checked = true;
      cb.addEventListener("change", () => {
        const allCheckbox = document.getElementById(`${columnToggleId}-all`);
        const all = [
          ...columnToggleContainer.querySelectorAll("input[type=checkbox]"),
        ].filter((c) => c.value !== "ALL");
        const checked = all.filter((c) => c.checked);
        allCheckbox.checked = checked.length === all.length; // toggle otomatis jika semua dicentang
        render();
      });
      label.appendChild(cb);
      label.append(" " + col);
      columnToggleContainer.appendChild(label);
    });
  }

  // === SORT ===
  function sortData(col) {
    const dir = sortState[col] === "asc" ? "desc" : "asc";
    sortState = { [col]: dir }; // reset semua sort kecuali kolom aktif
    filteredData.sort((a, b) => {
      if (a[col] < b[col]) return dir === "asc" ? -1 : 1;
      if (a[col] > b[col]) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  // === RENDER ===
  function render() {
    const selectedCols = [...columnToggleContainer.querySelectorAll("input")]
      .filter((cb) => cb.checked && cb.value !== "ALL")
      .map((cb) => cb.value);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    selectedCols.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      th.addEventListener("click", () => {
        sortData(col);
        render();
      });
      if (sortState[col]) {
        th.innerHTML += sortState[col] === "asc" ? " \u2191" : " \u2193";
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filteredData.slice(start, start + rowsPerPage);

    paginated.forEach((row) => {
      const tr = document.createElement("tr");
      selectedCols.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.innerHTML = "";
    table.appendChild(thead);
    table.appendChild(tbody);
    renderPagination();
  }

  // === PAGINATION ===
  function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        render();
      });
      paginationContainer.appendChild(btn);
    }
  }

  // === SEARCH ===
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredData = data.filter((row) =>
      Object.values(row).some((val) =>
        val.toString().toLowerCase().includes(query)
      )
    );
    currentPage = 1;
    render();
  });

  renderColumnToggle();
  render();
}

// === AMBIL DATA JSON DAN RENDER ===
Promise.all([
  fetch("data-banjir.json").then((res) => res.json()),
  fetch("data-perbandingan.json").then((res) => res.json()),
]).then(([banjirData, perbandinganData]) => {
  renderTable({
    data: banjirData,
    tableId: "table-banjir",
    searchId: "search-banjir",
    paginationId: "pagination-banjir",
    columnToggleId: "banjir-columns",
  });

  renderTable({
    data: perbandinganData,
    tableId: "table-perbandingan",
    searchId: "search-perbandingan",
    paginationId: "pagination-perbandingan",
    columnToggleId: "perbandingan-columns",
    prioritizeColumn: "Bencana Alam",
  });
});

// Toggle tombol checklist dropdown untuk tabel banjir
document
  .getElementById("toggle-banjir-columns")
  .addEventListener("click", () => {
    document.getElementById("banjir-columns").classList.toggle("hidden");
  });

// Toggle tombol checklist dropdown untuk tabel perbandingan
document
  .getElementById("toggle-perbandingan-columns")
  .addEventListener("click", () => {
    document.getElementById("perbandingan-columns").classList.toggle("hidden");
  });
