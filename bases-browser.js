const baseDirectory = document.querySelector("#base-directory-grid");
const baseSearch = document.querySelector("#base-search");
const baseStateFilter = document.querySelector("#base-state-filter");
const baseResults = document.querySelector("#base-browser-results");

if (baseDirectory && baseSearch && baseStateFilter && baseResults) {
  const cards = Array.from(baseDirectory.querySelectorAll(".base-card")).map((card) => {
    const title = card.querySelector("h2")?.textContent.trim() || "";
    const state = card.querySelector(".base-state")?.textContent.trim() || "";
    const units = Array.from(card.querySelectorAll(".base-units li"))
      .map((item) => item.textContent.trim())
      .join(" ");
    const searchText = [title, state, units].join(" ").toLowerCase();

    if (!card.querySelector(".base-card-cta")) {
      const cta = document.createElement("span");
      cta.className = "card-link base-card-cta";
      cta.textContent = "View base details";
      card.appendChild(cta);
    }

    return {
      card,
      state,
      searchText,
    };
  });

  const uniqueStates = Array.from(
    new Set(
      cards
        .map((entry) => entry.state)
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

  uniqueStates.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    baseStateFilter.appendChild(option);
  });

  const updateResults = (visibleCount) => {
    const searchValue = baseSearch.value.trim();
    const stateValue = baseStateFilter.value;
    if (visibleCount === cards.length && !searchValue && !stateValue) {
      baseResults.textContent = `${cards.length} base guides available.`;
      return;
    }

    if (visibleCount === 0) {
      baseResults.textContent =
        "No bases match that search yet. Try a different installation, unit, or location.";
      return;
    }

    const filters = [];
    if (searchValue) {
      filters.push(`"${searchValue}"`);
    }
    if (stateValue) {
      filters.push(stateValue);
    }

    baseResults.textContent = `${visibleCount} base guide${
      visibleCount === 1 ? "" : "s"
    } shown${filters.length ? ` for ${filters.join(" and ")}` : ""}.`;
  };

  const applyFilters = () => {
    const query = baseSearch.value.trim().toLowerCase();
    const selectedState = baseStateFilter.value;
    let visibleCount = 0;

    cards.forEach((entry) => {
      const matchesQuery = !query || entry.searchText.includes(query);
      const matchesState = !selectedState || entry.state === selectedState;
      const isVisible = matchesQuery && matchesState;
      entry.card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    updateResults(visibleCount);
  };

  baseSearch.addEventListener("input", applyFilters);
  baseSearch.addEventListener("search", applyFilters);
  baseStateFilter.addEventListener("change", applyFilters);

  applyFilters();
}
