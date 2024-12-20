function renderToStaticMarkup(element) {
    if (typeof element === 'string') {
      return element;
    }

    if (Array.isArray(element)) {
      return element.map(renderToStaticMarkup).join('');
    }

    if (typeof element === 'object' && element !== null) {
      if (typeof element.type === 'function') {
        // For function components
        return renderToStaticMarkup(element.type(element.props));
      }

      if (typeof element.type === 'string') {
        // For DOM elements
        const attrs = Object.entries(element.props || {})
          .filter(([key]) => key !== 'children')
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');

        const children = element.props.children
          ? renderToStaticMarkup(element.props.children)
          : '';

        return `<${element.type} ${attrs}>${children}</${element.type}>`;
      }
    }

    return '';
}

export { renderToStaticMarkup };