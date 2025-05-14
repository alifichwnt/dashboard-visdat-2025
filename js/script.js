// === GLOBAL VARIABLES ===
let provinsiTerpilih = "INDONESIA"; // Default nasional
let map,
  geoLayer,
  banjirData = [];
const tahunList = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"];

// === INISIALISASI PETA ===
map = L.map("map").setView([-2.5, 118], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// === FUNGSI WARNA PETA ===
function getColor(jumlah) {
  return jumlah > 100 ? "#0D2F4BFF" : jumlah > 50 ? "#0C76CEFF" : "#B5DBFAFF";
}

// === UPDATE PETA ===
function updateMap(tahun) {
  const kejadianByProvinsi = {};
  banjirData.forEach((d) => {
    kejadianByProvinsi[d.Provinsi] = d[`Kejadian-${tahun}`] || 0;
  });

  if (geoLayer) geoLayer.remove();

  geoLayer = L.geoJson(window.geoData, {
    style: (feature) => {
      const provinsi = feature.properties.PROVINSI;
      const jumlah = kejadianByProvinsi[provinsi] || 0;
      return {
        fillColor: getColor(jumlah),
        weight: 1,
        color: "white",
        fillOpacity: 0.7,
      };
    },
    onEachFeature: (feature, layer) => {
      const provinsi = feature.properties.PROVINSI;
      const jumlah = kejadianByProvinsi[provinsi] || 0;

      layer.bindPopup(
        `<strong>${provinsi}</strong><br>Kejadian Banjir: ${jumlah}`
      );

      layer.on("click", () => {
        // Toggle klik
        provinsiTerpilih =
          provinsiTerpilih === provinsi ? "INDONESIA" : provinsi;
        updateBarChart();
        buildAndUpdateLineCharts(); // ⬅️ fungsi untuk update data + chart
        layer.openPopup(); // Tetap tampilkan informasi provinsi
      });
    },
  }).addTo(map);
}

// === FUNGSI LATAR GELAP DI LUAR INDONESIA ===
function addDarkBackground() {
  const worldBounds = [
    [-90, -180],
    [90, 180],
  ];
  const indonesiaBounds = [
    [-11, 95],
    [6, 141],
  ]; // Perkiraan area Indonesia

  // Tutup seluruh dunia dengan warna hitam transparan
  L.rectangle(worldBounds, {
    color: "#000",
    weight: 0,
    fillOpacity: 0.5,
  }).addTo(map);

  // Buka area Indonesia (clear area)
  L.rectangle(indonesiaBounds, {
    color: "#000",
    weight: 0,
    fillOpacity: 0,
  }).addTo(map);
}

// === GLOBAL PIE CHART VARIABEL ===
let pieChart,
  perbandinganData = [];

const warnaKategori = {
  Banjir: "#007ACC",
  "Gempa Bumi": "#793709FF", // coklat
  Tsunami: "#003366", // biru dongker
  "Letusan Gunung Api": "#FF5733", // merah lava
  "Tanah Longsor": "#AA8A7BFF", // coklat tanah
  Kekeringan: "#DAA520", // emas
  "Kebakaran Hutan dan Lahan": "#D32F2F", // merah gelap
  "Bencana Lain": "#AAAAAA", // abu default
};

// === FUNGSI UPDATE PIE CHART ===
function updatePieChart(tahun = document.getElementById("pie-year").value) {
  const totalData = perbandinganData.find((d) => d["Bencana Alam"] === "TOTAL");
  const banjirData = perbandinganData.find(
    (d) => d["Bencana Alam"] === "Banjir"
  );

  const total = totalData?.[tahun] || 0;
  const banjir = banjirData?.[tahun] || 0;

  const checkboxes = document.querySelectorAll(
    "#bencana-list input[type=checkbox]"
  );
  const kategoriDipilih = [...checkboxes]
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const data = [];
  const labels = [];
  const colors = [];

  // Tambahkan Banjir
  data.push(banjir);
  labels.push("Banjir");
  colors.push(warnaKategori["Banjir"]);

  if (kategoriDipilih.length === 6) {
    // Semua diceklis → tampilkan Bencana Lain
    const bencanaLain = total - banjir;
    data.push(bencanaLain >= 0 ? bencanaLain : 0);
    labels.push("Bencana Lain");
    colors.push(warnaKategori["Bencana Lain"]);
  } else if (kategoriDipilih.length > 0) {
    // Tampilkan masing-masing kategori
    kategoriDipilih.forEach((kat) => {
      const dataKat = perbandinganData.find((d) => d["Bencana Alam"] === kat);
      const value = dataKat?.[tahun] || 0;
      data.push(value);
      labels.push(kat);
      colors.push(warnaKategori[kat] || "#888");
    });
  }

  // Jika semua checkbox tidak dicentang, tampilkan hanya banjir
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = data;
  pieChart.data.datasets[0].backgroundColor = colors;
  pieChart.update();
}

//Listener dropdown lokal pie chart
function pieDropdownListener() {
  const pieYearSelect = document.getElementById("pie-year");

  pieYearSelect.addEventListener("change", () => {
    const tahun = pieYearSelect.value;
    updatePieChart(tahun);
  });
}

//sinkronisasi MAP -> Pie (1 arah)
function syncPieYearWithMap(tahunMapTerpilih) {
  const pieYearSelect = document.getElementById("pie-year");
  pieYearSelect.value = tahunMapTerpilih;
  updatePieChart(tahunMapTerpilih);
}

function initBencanaChecklist() {
  const container = document.getElementById("bencana-list");
  container.innerHTML = ""; // Bersihkan jika ada sisa lama

  const kategoriList = [
    "Gempa Bumi",
    "Tsunami",
    "Letusan Gunung Api",
    "Tanah Longsor",
    "Kekeringan",
    "Kebakaran Hutan dan Lahan",
  ];

  kategoriList.forEach((kat) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = kat;
    checkbox.checked = true;

    // ✅ Tambahkan listener setelah checkbox ter-render
    checkbox.addEventListener("change", () => {
      updatePieChart(); // Pie chart langsung update saat checklist diubah
    });

    label.appendChild(checkbox);
    label.append(" " + kat);
    container.appendChild(label);
  });

  // ✅ Toggle dropdown visibility
  document.getElementById("bencana-toggle").addEventListener("click", () => {
    container.classList.toggle("hidden");
  });

  // ✅ Panggil updatePieChart SETELAH semua checkbox terbuat
  updatePieChart();
}

// === INISIALISASI PIE CHART (UPDATE DENGAN FORMAT PERSEN) ===
function initPieChart() {
  const pieCtx = document.getElementById("chart-pie").getContext("2d");
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Banjir", "Bencana Lain"],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: ["#007ACC", "#aaa"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            generateLabels: (chart) => {
              const data = chart.data.datasets[0].data;
              const total = data.reduce((a, b) => a + b, 0);
              return chart.data.labels.map((label, i) => {
                const value = data[i];
                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                return {
                  text: `${label} (${percent}%)`,
                  fillStyle: chart.data.datasets[0].backgroundColor[i],
                  strokeStyle: "#fff",
                  lineWidth: 1,
                  hidden: isNaN(value) || value === 0,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const data = context.dataset.data;
              const total = data.reduce((a, b) => a + b, 0);
              const value = data[context.dataIndex];
              const percent = total ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percent}%)`;
            },
          },
        },
      },
    },
  });
}

// === GLOBAL BAR CHART VARIABEL ===
let barChart;
//Data Kerusakan Absolute
function getKerusakanNasionalPerTahun() {
  const tahunBarChartList = ["2021", "2022", "2023", "2024"];

  const hasil = {
    ringan: [],
    sedang: [],
    berat: [],
  };

  tahunBarChartList.forEach((tahun) => {
    let ringan = 0,
      sedang = 0,
      berat = 0;
    banjirData.forEach((d) => {
      ringan += d[`Rusak-Ringan-${tahun}`] || 0;
      sedang += d[`Rusak-Sedang-${tahun}`] || 0;
      berat += d[`Rusak-Berat-${tahun}`] || 0;
    });
    hasil.ringan.push(ringan);
    hasil.sedang.push(sedang);
    hasil.berat.push(berat);
  });

  return { ...hasil, tahunBarChartList };
}
//Data kerusakan Relatif
function getKerusakanPerTahunPersen() {
  const tahunBarChartList = ["2021", "2022", "2023", "2024"];

  const hasil = {
    ringan: [],
    sedang: [],
    berat: [],
    ringanAsli: [],
    sedangAsli: [],
    beratAsli: [],
  };

  const dataNasional = banjirData.find((d) => d.Provinsi === provinsiTerpilih);

  tahunBarChartList.forEach((tahun) => {
    const ringan = dataNasional[`Rusak-Ringan-${tahun}`] || 0;
    const sedang = dataNasional[`Rusak-Sedang-${tahun}`] || 0;
    const berat = dataNasional[`Rusak-Berat-${tahun}`] || 0;
    const total = ringan + sedang + berat;

    const pr = total ? (ringan / total) * 100 : 0;
    const ps = total ? (sedang / total) * 100 : 0;
    const pb = total ? (berat / total) * 100 : 0;

    // Simpan data asli
    hasil.ringanAsli.push(pr);
    hasil.sedangAsli.push(ps);
    hasil.beratAsli.push(pb);

    // Paksa minimal visual 1% (tapi jaga total 100%)
    const prFix = pr < 1 && pr > 0 ? 1 : pr;
    const psFix = ps < 1 && ps > 0 ? 1 : ps;
    const pbFix = pb < 1 && pb > 0 ? 1 : pb;

    hasil.ringan.push(prFix);
    hasil.sedang.push(psFix);
    hasil.berat.push(pbFix);
  });

  return { ...hasil, tahunBarChartList };
}

function initKerusakanChecklist() {
  const container = document.getElementById("kerusakan-filter");
  container.innerHTML = "";

  const kategori = ["Rusak Ringan", "Rusak Sedang", "Rusak Berat"];

  kategori.forEach((kat) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = kat;
    cb.checked = true;

    cb.addEventListener("change", () => {
      updateBarChart();
    });

    label.appendChild(cb);
    label.append(" " + kat);
    container.appendChild(label);
  });

  // Toggle dropdown visibility
  document.getElementById("kerusakan-toggle").addEventListener("click", () => {
    container.classList.toggle("hidden");
  });

  // Initial rendering
  //updateBarChart();
}

function updateBarChart() {
  const raw = getKerusakanPerTahunPersen();
  const tahun = raw.tahunBarChartList;

  const label = document.getElementById("label-provinsi-bar");
  label.textContent =
    provinsiTerpilih === "INDONESIA"
      ? "Menampilkan data nasional"
      : `Menampilkan data: ${provinsiTerpilih}`;

  const checkboxes = document.querySelectorAll(
    "#kerusakan-filter input[type=checkbox]"
  );
  const kategoriDipilih = [...checkboxes]
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Peta warna kategori
  const warna = {
    "Rusak Ringan": "#66bb6a",
    "Rusak Sedang": "#ffa726",
    "Rusak Berat": "#ef5350",
  };

  // Buat ulang dataset berdasarkan pilihan
  const datasets = [];

  if (kategoriDipilih.includes("Rusak Ringan")) {
    datasets.push({
      label: "Rusak Ringan",
      data: raw.ringan,
      backgroundColor: warna["Rusak Ringan"],
    });
  }
  if (kategoriDipilih.includes("Rusak Sedang")) {
    datasets.push({
      label: "Rusak Sedang",
      data: raw.sedang,
      backgroundColor: warna["Rusak Sedang"],
    });
  }
  if (kategoriDipilih.includes("Rusak Berat")) {
    datasets.push({
      label: "Rusak Berat",
      data: raw.berat,
      backgroundColor: warna["Rusak Berat"],
    });
  }

  // Update chart config
  const isStacked = datasets.length > 1;

  barChart.data.labels = tahun;
  barChart.data.datasets = datasets;
  barChart.options.scales.x.stacked = isStacked;
  barChart.options.scales.y.stacked = isStacked;
  barChart.update();
}

// === INISIALISASI STACKED BAR CHART ===
function initBarChart() {
  const barCtx = document.getElementById("chart-bar").getContext("2d");
  const raw = getKerusakanPerTahunPersen();

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: raw.tahunBarChartList,
      datasets: [], // Awalnya kosong → akan diisi oleh updateBarChart()
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const value = context.raw.toFixed(1);
              return `${label}: ${value}%`;
            },
          },
        },
        legend: { position: "bottom" },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
          title: { display: true, text: "Proporsi (%)" },
        },
      },
    },
  });

  // Setelah barChart dibuat → isi kontennya
  updateBarChart();
}

// === FUNGSI BANGUN DATA TREN KORBAN ===
function buildKorbanTren() {
  const korbanSelamat = [];
  const korbanMeninggal = [];

  const data = banjirData.find((d) => d.Provinsi === provinsiTerpilih);

  tahunList.forEach((tahun) => {
    const selamat = data?.[`Korban-Selamat-${tahun}`] || 0;
    const meninggal = data?.[`Korban-Meninggal-${tahun}`] || 0;

    korbanSelamat.push(selamat);
    korbanMeninggal.push(meninggal);
  });

  return { korbanSelamat, korbanMeninggal };
}

// === GLOBAL LINE CHART VARIABEL ===
let lineChartSelamat, lineChartMeninggal;

function buildAndUpdateLineCharts() {
  // ✅ Update label provinsi aktif
  const label = document.getElementById("label-provinsi-line");
  label.textContent =
    provinsiTerpilih === "INDONESIA"
      ? "Menampilkan data nasional"
      : `Menampilkan data: ${provinsiTerpilih}`;
  const dataKorban = buildKorbanTren();

  // Update grafik Selamat
  lineChartSelamat.data.datasets[0].data = dataKorban.korbanSelamat;
  lineChartSelamat.options.scales.y.suggestedMax =
    Math.max(...dataKorban.korbanSelamat) * 1.1;
  lineChartSelamat.update();

  // Update grafik Meninggal
  lineChartMeninggal.data.datasets[0].data = dataKorban.korbanMeninggal;
  lineChartMeninggal.options.scales.y.suggestedMax =
    Math.max(...dataKorban.korbanMeninggal) * 1.1;
  lineChartMeninggal.update();
}

// === INISIALISASI LINE CHART ===
function initLineCharts() {
  const ctx1 = document.getElementById("chart-line-selamat").getContext("2d");
  const ctx2 = document.getElementById("chart-line-meninggal").getContext("2d");

  lineChartSelamat = new Chart(ctx1, {
    type: "line",
    data: {
      labels: tahunList,
      datasets: [
        {
          label: "Korban Selamat",
          data: [],
          borderColor: "green",
          backgroundColor: "rgba(0,128,0,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 15,
          hitRadius: 20,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              return `Selamat: ${val.toLocaleString("id-ID")}`;
            },
          },
        },
        legend: { display: false },
      },
      scales: {
        x: { title: { display: true, text: "Tahun" } },
        y: {
          title: { display: true, text: "Jumlah" },
          suggestedMin: 0,
        },
      },
    },
  });

  lineChartMeninggal = new Chart(ctx2, {
    type: "line",
    data: {
      labels: tahunList,
      datasets: [
        {
          label: "Korban Meninggal",
          data: [],
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 15,
          hitRadius: 20,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Tahun" } },
        y: {
          title: { display: true, text: "Jumlah" },
          suggestedMin: 0,
        },
      },
    },
  });

  // ✅ Panggil builder setelah chart selesai dibentuk
  buildAndUpdateLineCharts();
}

// === FETCH DATA GEOJSON DAN JSON BANJIR ===
function fetchData() {
  Promise.all([
    fetch("indonesia-province.json").then((res) => res.json()),
    fetch("data-banjir.json").then((res) => res.json()),
    fetch("data-perbandingan.json").then((res) => res.json()), // <== Tambah ini
  ]).then(([geoData, banjir, perbandingan]) => {
    window.geoData = geoData;
    banjirData = banjir;
    perbandinganData = perbandingan;

    // Inisialisasi chart
    initPieChart();
    initBencanaChecklist();
    pieDropdownListener();

    const tahunAwal = document.getElementById("year").value;
    updateMap(tahunAwal);
    //updatePieChart(tahunAwal); // <== Tambah ini
    initKerusakanChecklist();
    initBarChart();
    initLineCharts();
  });
}

// === EVENT LISTENER DROPDOWN ===
document.getElementById("year").addEventListener("change", (e) => {
  const tahun = e.target.value;
  updateMap(tahun);
  syncPieYearWithMap(tahun); // Sinkronisasi ke pie chart
  updatePieChart();
});

// === JALANKAN SEMUA SAAT PAGE LOAD ===
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  addDarkBackground();
});
