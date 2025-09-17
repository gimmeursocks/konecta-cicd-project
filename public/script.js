let namesData = [];
let weeksData = [];
let statusesData = [];
let historyData = {};

function createDropdown(options, selectedValue = "") {
  const select = document.createElement("select");
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (opt === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  return select;
}

function applyStatusColor(select) {
  select.className = "status-select"; // Reset classes
  const selectedStatus = select.value;
  select.classList.add(`status-${selectedStatus}`);
}

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  namesData.sort((a, b) => a.name.localeCompare(b.name));

  namesData.forEach((emp, index) => {
    const row = document.createElement("tr");
    row.dataset.empId = emp.id;
    row.classList.add(index % 2 === 0 ? "even-row" : "odd-row");

    // Name cell
    const nameCell = document.createElement("td");
    nameCell.textContent = emp.name;
    row.appendChild(nameCell);

    // Week cell
    const weekCell = document.createElement("td");
    const defaultWeek =
      Object.keys(historyData[emp.id] || {})[0] || weeksData[0];
    const weekSelect = createDropdown(weeksData, defaultWeek);
    weekSelect.classList.add("week-select");
    weekCell.appendChild(weekSelect);
    row.appendChild(weekCell);

    // Render status dropdowns for a selected week
    const renderDays = (week) => {
      while (row.children.length > 2) {
        row.removeChild(row.lastChild);
      }

      const daysData = historyData[emp.id]?.[week] || {};
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
        const cell = document.createElement("td");
        const selectedStatus = daysData[day] || "Empty";
        const daySelect = createDropdown(statusesData, selectedStatus);
        daySelect.classList.add("status-select");
        daySelect.dataset.day = day;
        applyStatusColor(daySelect);
        daySelect.addEventListener("change", () => applyStatusColor(daySelect));
        cell.appendChild(daySelect);
        row.appendChild(cell);
      });
    };

    renderDays(defaultWeek);

    // Update days when week changes
    weekSelect.addEventListener("change", () => {
      renderDays(weekSelect.value);
    });

    tableBody.appendChild(row);
  });
}

async function loadData() {
  const namesRes = await fetch("/input/names.json");
  const weeksRes = await fetch("/input/selection.json");
  const statusRes = await fetch("/input/status.json");
  const historyRes = await fetch("/output/history.json");

  namesData = await namesRes.json();
  weeksData = await weeksRes.json();
  statusesData = await statusRes.json();

  try {
    historyData = await historyRes.json();
  } catch {
    historyData = {};
  }

  // Cleanup invalid entries
  for (const empId in historyData) {
    if (!namesData.some((n) => n.id === empId)) {
      delete historyData[empId];
      continue;
    }
    for (const week in historyData[empId]) {
      if (!weeksData.includes(week)) {
        delete historyData[empId][week];
      }
    }
  }

  renderTable();
}

document.addEventListener("DOMContentLoaded", loadData);

document.getElementById("saveBtn").addEventListener("click", async () => {
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const empId = row.dataset.empId;
    const week = row.querySelector(".week-select").value;
    const days = {};
    row.querySelectorAll(".status-select").forEach((sel) => {
      days[sel.dataset.day] = sel.value;
    });

    if (!historyData[empId]) {
      historyData[empId] = {};
    }
    historyData[empId][week] = days;
  });

  const response = await fetch("/save-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(historyData, null, 2),
  });

  if (response.ok) {
    alert("History saved successfully.");
  } else {
    alert("Error saving history.");
  }
});
