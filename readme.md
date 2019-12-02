# for-each-project


Personal tool that iterates through all my projects to make bulk changes.



## API Reference
**Kind**: Exported function  
**Returns**: <code>Promise.&lt;(boolean\|null)&gt;</code> - `true` if repository is dirty, `false` if repository is clean, `null` if given directory is not a git repository  

| Param | Type | Description |
| --- | --- | --- |
| directory | <code>string</code> | Absolute path to a git repository directory |

**Example**  
```javascript
import forEachProject from "for-each-project"
const result = await forEachProject("/my/path")
result === false
```

