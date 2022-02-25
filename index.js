/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-grid-flex',
    Declaration (decl, { Rule, Declaration }) {
      if (decl.prop === 'justify-content' && decl.value === 'space-evenly') {
        decl.assign({ prop: 'justify-content', value: 'space-between' });

        const ruleDeclarations = [
          new Declaration({ prop: 'content', value: '""' }),
          new Declaration({ prop: 'display', value: 'block' })
        ];

        const selectors = ['before', 'after'];

        selectors.forEach(selector => {
          const rule = new Rule({
            selector: `${decl.parent.selector}:${selector}`
          });

          ruleDeclarations.forEach(declaration => rule.push(declaration));
          decl.parent.after(rule);
        });
      }

      if (decl.prop === 'grid-template-columns') {
        const match = /repeat\((\d),\s*1fr\)/.exec(decl.value);

        if (match != null) {
          const rule = decl.parent;
          const itemCount = match[1];

          rule.push(new Declaration({ prop: 'display', value: 'flex' }));
          rule.push(new Declaration({ prop: 'flex-wrap', value: 'wrap' }));

          const allChildrenRule = new Rule({
            selector: `${decl.parent.selector} > *`
          });

          allChildrenRule.push(new Declaration({ prop: 'flex', value: `1 0 ${100 / itemCount}%` }));

          rule.after(allChildrenRule);
        }
      }

      if (decl.prop === 'grid-gap') {
        const unitsMatch = /([+-]?([0-9]*[.])?[0-9]+)(\w{2,3})/.exec(decl.value);

        if (unitsMatch != null) {
          const rule = decl.parent;
          const margin = `${unitsMatch[1] * 2}${unitsMatch[3]}`;

          rule.push(new Declaration({ prop: 'margin-left', value: `-${margin}` }));

          const allChildrenRule = new Rule({
            selector: `${decl.parent.selector} > *`
          });

          allChildrenRule.push(new Declaration({ prop: 'margin-left', value: margin }));
          allChildrenRule.push(new Declaration({ prop: 'margin-bottom', value: margin }));

          rule.after(allChildrenRule);
        }
      }
    }
  }
}

module.exports.postcss = true
