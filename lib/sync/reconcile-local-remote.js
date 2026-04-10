export const defaultHasData = (payload) => Boolean(payload);

const valuesEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export const reconcileLocalAndRemoteState = async ({
  loadLocal,
  fetchRemote,
  hasData = defaultHasData,
  pushLocal,
  saveLocal,
  markInitialSync,
  backupLocal,
  normalize,
}) => {
  const localStateRaw = loadLocal();
  const remoteStateRaw = await fetchRemote();

  const localHasData = hasData(localStateRaw);
  const remoteHasData = hasData(remoteStateRaw);

  let source = "local";
  let backedUpLocal = false;
  let nextState = normalize ? normalize(localStateRaw) : localStateRaw;

  if (!remoteHasData && localHasData) {
    await pushLocal(localStateRaw);
    source = "local-pushed";
  } else if (remoteHasData) {
    if (!valuesEqual(localStateRaw, remoteStateRaw)) {
      if (localHasData && backupLocal) {
        backupLocal(localStateRaw);
        backedUpLocal = true;
      }

      saveLocal(remoteStateRaw);
    }

    source = "remote";
    nextState = normalize ? normalize(remoteStateRaw) : remoteStateRaw;
  }

  markInitialSync?.();

  return {
    backedUpLocal,
    source,
    state: nextState,
  };
};
