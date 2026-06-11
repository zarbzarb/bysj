const DataICompKit = {
  getAttr: (comp) => comp?.instance?.compAttr ?? comp?.preAttr?._attr ?? comp?._attr,
  getConfig: (comp) => comp?.instance?.config ?? comp?.preAttr?._config ?? comp?.config,
};

export default DataICompKit;
