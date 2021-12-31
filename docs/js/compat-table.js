let baseURL = "/PCSX2.github.io";

// state
let sortedData = undefined; // Initialized on page load, this should NEVER be mutated
let currentData = undefined;
let pageSize = 25;
let currentPage = 0;

let showPerfect = true;
let showPlayable = true;
let showInGame = true;
let showMenus = true;
let showIntro = true;
let showNothing = true;

let searchString = "";

window.onload = async () => {
  document.getElementById("compat-search").value = "";
  document.activeElement.blur();
  tableLoading();
  dataReq = await fetch(`${baseURL}/compat/data.json`);
  let compatData = await dataReq.json();
  sortedData = _.sortBy(compatData, 'title');
  currentData = sortedData;
  setTimeout(() => {
    renderTable();
  }, 500);
};

// config
let paginationButtonCount = 5;

const searchOptions = {
  minMatchCharLength: 1,
  threshold: 0.2,
  keys: [
    "title",
    "serial",
    "crc"
  ]
};

// TODO - pagination with query params


// Filter Button Handlers
// TODO - clean this up with jquery
function updateClassList(domElement, filterOn) {
  domElement.classList.remove(filterOn ? "off" : "on");
  domElement.classList.add(filterOn ? "on" : "off");
  filterData();
}

document.getElementById("compat-filter-perfect").onclick = (event) => {
  showPerfect = !showPerfect;
  updateClassList(event.target, showPerfect);
}

document.getElementById("compat-filter-playable").onclick = (event) => {
  showPlayable = !showPlayable;
  updateClassList(event.target, showPlayable);
}

document.getElementById("compat-filter-ingame").onclick = (event) => {
  showInGame = !showInGame;
  updateClassList(event.target, showInGame);
}

document.getElementById("compat-filter-menus").onclick = (event) => {
  showMenus = !showMenus;
  updateClassList(event.target, showMenus);
}

document.getElementById("compat-filter-intro").onclick = (event) => {
  showIntro = !showIntro;
  updateClassList(event.target, showIntro);
}

document.getElementById("compat-filter-nothing").onclick = (event) => {
  showNothing = !showNothing;
  updateClassList(event.target, showNothing);
}

// Combines all of the filters and search strings on the dataset, and re-inits the data.
function filterData() {
  // 1. Filters
  let filteredData = sortedData.filter(entry => {
    // I could likely be more creative here
    switch (entry.status.toLowerCase()) {
      case 'perfect':
        return showPerfect;
      case 'playable':
        return showPlayable;
      case 'ingame':
        return showInGame;
      case 'menus':
        return showMenus;
      case 'intro':
        return showIntro;
      case 'nothing':
        return showNothing;
      default:
        return false;
    }
  });
  // 2. Search Input
  if (searchString !== "") {
    let fuse = new Fuse(filteredData, searchOptions);
    let results = fuse.search(searchString);
    // Coerce into a format our rendering function expects
    let tableData = []
    for (var i = 0; i < results.length; i++) {
      tableData.push(results[i].item);
    }
    filteredData = tableData;
  }
  currentData = filteredData;
  renderTable();
}

// Page Size Handler
$('#compat-page-size-list a').click(function () {
  $('#compat-page-size').text(`${$(this).text()} Per Page`);
  pageSize = parseInt($(this).text());
  tableLoading();
  setTimeout(() => {
    renderTable(sortedData, 0);
  }, 500);
});

var searchTimer;
var searchInput = document.getElementById("compat-search");
searchInput.oninput = function () {
  searchString = this.value;
  if (searchString == "") {
    filterData();
    return;
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filterData();
  }, 500);
  let tableBody = document.getElementById("compat-table-body");
  if (tableBody.innerHTML != `<tr style="align-content: center;text-align: center;"><td colspan="5"><img class="loading-logo" src="${baseURL}/img/pcsx2-logo.svg"></object></td></tr>`) {
    tableBody.innerHTML = `<tr style="align-content: center;text-align: center;"><td colspan="5"><img class="loading-logo" src="${baseURL}/img/pcsx2-logo.svg"></object></td></tr>`;
  }
}

function tableLoading() {
  let tableBody = document.getElementById("compat-table-body");
  if (tableBody.innerHTML != `<tr style="align-content: center;text-align: center;"><td colspan="5"><img class="loading-logo" src="${baseURL}/img/pcsx2-logo.svg"></object></td></tr>`) {
    tableBody.innerHTML = `<tr style="align-content: center;text-align: center;"><td colspan="5"><img class="loading-logo" src="${baseURL}/img/pcsx2-logo.svg"></object></td></tr>`;
  }
}

function getEmojiFlag(region) {
  switch (region) {
    case "us":
      return "🇺🇸";
    case "eu":
      return "🇪🇺";
    case "ch":
      return "🇨🇳";
    case "ja":
      return "🇯🇵";
    case "kr":
      return "🇰🇷";
    case "fr":
      return "🇫🇷";
    case "de":
      return "🇩🇪";
    default:
      return "👽";
  }
}

// HTML Templates
let rowTemplate = doT.template(`<tr><td class="game-title"><i class="fas fa-circle compat-status {{=it.status}}"></i>&nbsp;{{=it.title}}</td><td>{{=it.flag}}&nbsp;{{=it.serial}}</td><td>{{=it.crc}}</td><td>{{=it.testedVersion}}</td><td>{{=it.lastUpdated}}</td></tr>`);
let pageButtonTemplate = doT.template('<div class="col-md-auto"><button type="button" class="btn btn-pagination" value="{{=it.val}}" {{? it.disabled }}disabled{{?}}>{{=it.val}}</button></div>')

// Initialize the Compatibility Table, given an array of compatibility objects.
function renderTable() {
  let tableBody = document.getElementById("compat-table-body");
  tableBody.innerHTML = ``;

  // Handle no results uniquely
  if (currentData.length <= 0) {
    tableBody.innerHTML = `<tr style="align-content: center;text-align: center;"><td colspan="5">No Results Found</object></td></tr>`;
  }
  else {
    let offset = currentPage * pageSize;
    for (var i = 0; i < pageSize && i + offset < currentData.length; i++) {
      let entry = currentData[i + offset];
      var lastUpdatedDate = new Date(entry.last_tested_date);
      var lastUpdatedDateStr = `${lastUpdatedDate.getFullYear()}-${("0"+(lastUpdatedDate.getMonth()+1)).slice(-2)}-${("0" + lastUpdatedDate.getDate()).slice(-2)}`;
      tableBody.innerHTML += rowTemplate({
        title: entry.title,
        status: entry.status,
        flag: getEmojiFlag(entry.region),
        serial: entry.serial,
        crc: entry.crc,
        testedVersion: entry.last_tested_version,
        lastUpdated: lastUpdatedDateStr
      })
    }
  }
  renderPaginationButtons();
}

function renderPaginationButtons() {
  $('#compat-pagination-container').html('');
  if (currentData.length <= 0) {
    return;
  }
  let totalPages = Math.ceil(currentData.length / pageSize);
  let buttonValues = pagination(currentPage, totalPages);
  for(var i = 0; i < buttonValues.length; i++) {
    $('#compat-pagination-container').append(pageButtonTemplate({
      val: buttonValues[i],
      disabled: buttonValues[i] === "..."
    }));
  }
  $('.btn-pagination').on('click', function (evt) {
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    if (evt.target.value != "...") {
      currentPage = parseInt(evt.target.value) - 1;
      tableLoading();
      setTimeout(() => {
        renderTable(sortedData, currentPage);
      }, 500);
    }
  });
}

function pagination(current, total) {
  current++;
  if (total <= 1) return [1];
  const center = [current - 2, current - 1, current, current + 1, current + 2],
      filteredCenter = center.filter((p) => p > 1 && p < total),
      includeThreeLeft = current === 5,
      includeThreeRight = current === total - 4,
      includeLeftDots = current > 5,
      includeRightDots = current < total - 4;

  if (includeThreeLeft) filteredCenter.unshift(2)
  if (includeThreeRight) filteredCenter.push(total - 1)

  if (includeLeftDots) filteredCenter.unshift('...');
  if (includeRightDots) filteredCenter.push('...');

  return [1, ...filteredCenter, total]
}
