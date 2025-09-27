const buildOptions = (endpoint, parsedBody) => {
  const { 
    model, 
    temperature,
    top_p,
    max_tokens,
    stream,
    messages,
    ...rest 
  } = parsedBody;

  const endpointOption = {
    endpoint,
    model: model || 'thrive-coach',
    temperature: temperature ?? 0.7,
    top_p: top_p ?? 1,
    max_tokens: max_tokens ?? 2000,
    stream: stream ?? true,
    messages,
    modelOptions: {
      model: model || 'thrive-coach',
      temperature: temperature ?? 0.7,
      top_p: top_p ?? 1,
      max_tokens: max_tokens ?? 2000,
      ...rest
    }
  };

  return endpointOption;
};

module.exports = buildOptions;