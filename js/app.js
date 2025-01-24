// REST Countries API
// https://restcountries.com/

const url = "https://restcountries.com/v3.1/";
const cardList = document.getElementById("countries");
const searchBar = document.getElementById("search-bar");
const sortBy = document.getElementById("sort-by");
const filterToggle = document.getElementById("filter-results");
const filterOptions = document.querySelectorAll('input[name="filter-by"]');
const filterSelections = document.getElementById("filter-selections");
const warnMessage = document.getElementById("warning-message");

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav");
  const buttonAll = document.createElement("button");
  const sortOptions = document.querySelectorAll('input[name="sort-order"]');

  buttonAll.textContent = "All";
  buttonAll.addEventListener("click", async () => {
    searchBar.value = "";
    displaySearchResults();
  });
  // initialize letter buttons
  for (let i = 90; i >= 65; i--) {
    const letter = String.fromCharCode(i);
    const button = document.createElement("button");
    button.textContent = letter;

    // show all countries whose (common) names start with the letter clicked on
    // async = asynchronous function - allows other functions to execute before it finishes its own execution
    button.addEventListener("click", async () => {
      // await keyword makes the current function wait for the function it's calling to finish
      // executing (by resolving or rejecting promise) before continuing its own execution
      let data = await fetchData("all");
      data = data.filter((country) => country.name.common[0] === letter);
      searchBar.value = "";
      displayData(data);
    });
    // adds the element to 'nav' before the existing child elements
    nav.prepend(button);
  }
  nav.prepend(buttonAll);
  searchBar.addEventListener("search", displaySearchResults);

  // every time the sorting order is changed, an array is created from the children of cardList,
  // which is then reordered and each card gets appended back into cardList; this is so that data
  // isn't fetched and cards aren't recreated every time the sorting order is changed
  sortBy.addEventListener("change", () => {
    let cards = Array.from(cardList.children);
    cards = getSortedList(cards);
    cardList.innerHTML = "";
    cards.forEach((card) => {
      cardList.appendChild(card);
    });
  });
  sortOptions.forEach((option) => {
    option.addEventListener("change", () => {
      const cards = Array.from(cardList.children);
      cards.reverse();
      cardList.innerHTML = "";
      cards.forEach((card) => {
        cardList.appendChild(card);
      });
    });
  });
  filterToggle.addEventListener("change", () => {
    toggleFilters();
    adjustFilters();
  });
  // Anonymous (identifier-less), immediately-invoked function
  (async () => {
    const data = await fetchData("all");
    initFilterOptions(data);
    displayData(data);
  })();
  toggleFilters();
});

async function fetchData(query) {
  const response = await fetch(url + query);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${query}`);
  }
  const data = await response.json();
  return data;
}

function displayData(data) {
  // clear existing data
  cardList.innerHTML = "";

  if (data.length > 0) {
    let list = [];
    warnMessage.hidden = true;

    // filter results if filter checkbox is checked
    if (filterToggle.checked) {
      data = getFilteredData(data);
    }
    if (data.length > 0) {
      for (let country of data) {
        list.push(getCard(country));
      }
      list = getSortedList(list);

      for (let country of list) {
        cardList.appendChild(country);
      }
    } else {
      warnMessage.hidden = false;
    }
  } else {
    warnMessage.hidden = false;
  }
}

async function displaySearchResults() {
  let data;

  // display all countries if search bar is empty
  if (searchBar.value === "") {
    data = await fetchData("all");
    displayData(data);
    return;
  }
  // attempts searching for different properties in case one returns no result
  try {
    data = await fetchData("name/" + searchBar.value);

    // attempts to show results based on common names before attempting to show results based on
    // all names (native, official, etc.)
    let filteredData = data.filter((country) => {
      country.name.common.toLowerCase().includes(searchBar.value);
    });
    if (filteredData.length > 0) {
      data = filteredData;
    }
  } catch (error) {
    try {
      data = await fetchData("translation/" + searchBar.value);
    } catch (error) {
      try {
        data = await fetchData("capital/" + searchBar.value);
      } catch (error) {
        try {
          data = await fetchData("lang/" + searchBar.value);
        } catch (error) {
          try {
            data = await fetchData("demonym/" + searchBar.value);
          } catch (error) {
            try {
              data = await fetchData("region/" + searchBar.value);
            } catch (error) {
              data = await fetchData("subregion/" + searchBar.value);
            }
          }
        }
      }
    }
  } finally {
    displayData(data);
  }
}

function getCard(country) {
  const card = document.createElement("div");
  const name = document.createElement("h2");
  const flag = document.createElement("img");
  const info = document.createElement("div");
  const officialName = document.createElement("h3");
  const capital = document.createElement("p");
  const continents = document.createElement("p");
  const region = document.createElement("p");
  const languages = document.createElement("p");
  const area = document.createElement("p");
  const population = document.createElement("p");
  const currencies = document.createElement("p");
  const mapLink = document.createElement("a");

  card.id = "card";
  name.id = "name";
  info.id = "info";
  capital.id = "capital";
  languages.id = "langs";
  continents.id = "continents";
  region.id = "region";
  area.id = "area";
  population.id = "population";
  mapLink.id = "map";

  name.textContent = `${country.name.common} - ${country.cca2}`;
  mapLink.href = country.maps.googleMaps;
  mapLink.textContent = "View on Google Maps";
  mapLink.target = "_blank";

  flag.src = country.flags.png;
  flag.alt = `Flag of ${name}`;
  flag.addEventListener("click", () => {
    open(mapLink.href, "_blank");
  });
  officialName.innerHTML = `Officially known as:<br>${country.name.official}`;
  capital.innerHTML = `<b>Capital:</b> ${country.capital ? country.capital : "N/A"}`;

  if (country.languages) {
    if (Object.keys(country.languages).length === 1) {
      languages.innerHTML = `<b>Official Language:</b> ${Object.values(country.languages)[0]}`;
    } else {
      const langs = [];

      for (const lang in country.languages) {
        langs.push(country.languages[lang]);
      }
      languages.innerHTML = `<b>Official Languages:</b> ${langs.join(", ")}`;
    }
  } else {
    languages.innerHTML = "<b>Official Language:</b> N/A";
  }
  if (Object.keys(country.continents).length === 1) {
    continents.innerHTML = `<b>Continent:</b> ${Object.values(country.continents)[0]}`;
  } else {
    const continents = [];

    for (const c in country.continents) {
      continents.push(country.continents[c]);
    }
    languages.innerHTML = `<b>Continents:</b> ${continents.join(", ")}`;
  }
  region.innerHTML = `<b>Region:</b> ${country.region ? country.region : "N/A"}`;

  if (country.region && country.subregion) {
    region.innerHTML += ` (${country.subregion})`;
  }
  area.innerHTML = `<b>Area:</b> ${country.area} km\u00B2`;
  population.innerHTML = `<b>Population:</b> ${country.population}`;

  if (country.currencies) {
    const entries = Object.entries(country.currencies);
    const currencyLabel = entries.length === 1 ? "Currency" : "Currencies";

    entries.forEach(([k, v]) => {
      const { name, symbol } = v;
      currencies.innerHTML = `<b>${currencyLabel}:</b> ${name} (${k}) - ${symbol}`;
    });
  } else {
    currencies.innerHTML = "<b>Currencies:</b> N/A";
  }
  card.appendChild(name);
  card.appendChild(flag);
  card.appendChild(info);
  info.appendChild(officialName);
  info.appendChild(capital);
  info.appendChild(languages);
  info.appendChild(continents);
  info.appendChild(region);
  info.appendChild(area);
  info.appendChild(population);
  info.appendChild(currencies);
  info.appendChild(mapLink);

  return card;
}

function getSortedList(list) {
  const selection = sortBy.options[sortBy.selectedIndex].value;

  switch (selection) {
    case "name":
      list = getStringSortedList(list, "name", 0, 5);
      break;
    case "capital":
      list = getStringSortedList(list, "capital", "Capital: ".length, 0);
      break;
    case "area":
      list = getNumberSortedList(list, "area", "Area: ".length, 4);
      break;
    case "population":
      list = getNumberSortedList(list, "population", "Population: ".length, 0);
      break;
  }
  if (document.getElementById("sort-descending").checked) {
    list.reverse();
  }
  return list;
}

function getStringSortedList(list, id, start, end) {
  list.sort((a, b) => {
    let strA = a.querySelector(`#${id}`).textContent.toLowerCase();
    let strB = b.querySelector(`#${id}`).textContent.toLowerCase();

    strA = strA.substring(start, strA.length - end);
    strB = strB.substring(start, strB.length - end);

    return strA > strB ? 1 : strA < strB ? -1 : 0;
  });
  return list;
}

function getNumberSortedList(list, id, start, end = 0) {
  list.sort((a, b) => {
    let strA = a.querySelector(`#${id}`).textContent;
    let strB = b.querySelector(`#${id}`).textContent;

    strA = strA.substring(start, strA.length - end);
    strB = strB.substring(start, strB.length - end);

    return Number(strA) - Number(strB);
  });
  return list;
}

function toggleFilters() {
  const filterOptions = document.getElementById("filter-options");
  setDisabled(filterOptions, !filterToggle.checked);
}

// enables or disables an element recursively, meaning all of its children and all of their
// children (and so on...) are also enabled or disabled
function setDisabled(element, disabled) {
  for (const child of element.children) {
    child.disabled = disabled;

    if (child.children.length > 0) {
      setDisabled(child, disabled);
    }
  }
}

function adjustFilters() {
  for (const select of filterSelections.children) {
    select.hidden = true;
  }
  for (const option of filterOptions) {
    // determines which select element should be visible based on its id and the id of
    // the filter option
    if (option.checked) {
      const value = option.id.substring("filter-by-".length);
      filterSelections.querySelector(`#${value}-options`).hidden = false;
      break;
    }
  }
  displaySearchResults();
}

function initFilterOptions(data) {
  const langOptions = new Set();
  const continentOptions = new Set();
  const regionOptions = new Set();

  for (const country of data) {
    if (country.languages) {
      for (const lang in country.languages) {
        // Repeated values will not be added to 'langOptions' due to it
        // being a set, which stores only unique values
        langOptions.add(country.languages[lang]);
      }
    }
    if (country.continents) {
      for (const c in country.continents) {
        continentOptions.add(country.continents[c]);
      }
    }
    if (country.region) {
      regionOptions.add(country.region);
    }
    if (country.subregion) {
      regionOptions.add(country.subregion);
    }
  }
  const sortedLangs = Array.from(langOptions).sort();
  const sortedContinents = Array.from(continentOptions).sort();
  const sortedRegions = Array.from(regionOptions).sort();

  // select element options are created dynamically from sorted data
  initFilterSelectOptions("lang", sortedLangs);
  initFilterSelectOptions("continent", sortedContinents);
  initFilterSelectOptions("region", sortedRegions);

  for (const select of filterSelections.children) {
    const value = select.id.substring(0, select.id.indexOf("-"));
    const radioButton = document.getElementById(`filter-by-${value}`);

    select.addEventListener("change", displaySearchResults); // changes results to match search and filter
    radioButton.addEventListener("change", adjustFilters); // changes results and filter elements
  }
}

function initFilterSelectOptions(id, arr) {
  for (const option of arr) {
    const element = document.createElement("option");
    element.textContent = option;
    filterSelections.querySelector(`#${id}-options`).appendChild(element);
  }
}

function getFilteredData(data) {
  let value;

  for (const option of filterOptions) {
    if (option.checked) {
      value = option.id.substring("filter-by-".length);
      break;
    }
  }
  switch (value) {
    case "lang":
      return getArrayFilteredData(data, value, "languages");
    case "continent":
      return getArrayFilteredData(data, value, "continents");
    case "region":
      return getRegionFilteredData(data);
  }
}

function getArrayFilteredData(data, id, arr) {
  const select = filterSelections.querySelector(`#${id}-options`);
  const selectedOption = select.options[select.selectedIndex].textContent;

  return data.filter((country) => {
    return country[arr] && Object.values(country[arr]).includes(selectedOption);
  });
}

function getRegionFilteredData(data) {
  const select = filterSelections.querySelector("#region-options");
  const selectedOption = select.options[select.selectedIndex].textContent;

  return data.filter((country) => {
    return country.region === selectedOption || country.subregion === selectedOption;
  });
}
