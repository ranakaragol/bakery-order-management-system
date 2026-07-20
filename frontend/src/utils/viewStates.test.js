import test from "node:test";
import assert from "node:assert/strict";
import { getCollectionViewState } from "./viewStates.js";

test("collection state keeps api error and empty list distinct", () => {
  const errorState = getCollectionViewState({
    items: [],
    isLoading: false,
    errorMessage: "Sunucu hatası"
  });
  const emptyState = getCollectionViewState({
    items: [],
    isLoading: false,
    errorMessage: ""
  });

  assert.equal(errorState.showError, true);
  assert.equal(errorState.showEmpty, false);
  assert.equal(emptyState.showError, false);
  assert.equal(emptyState.showEmpty, true);
});

test("collection state treats background refresh separately from first load", () => {
  const firstLoadState = getCollectionViewState({
    items: [],
    isLoading: true
  });
  const refreshState = getCollectionViewState({
    items: [{ id: 1 }],
    isLoading: true
  });

  assert.equal(firstLoadState.showLoading, true);
  assert.equal(firstLoadState.showRefreshing, false);
  assert.equal(refreshState.showLoading, false);
  assert.equal(refreshState.showRefreshing, true);
});
