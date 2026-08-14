<h1>🧩 Kaoto Custom Components (Apache Camel Extensions)</h1>

<p>
This document explains how the <strong>custom Kaoto components</strong> in the Middleware system were created, structured, and integrated into the Apache Camel runtime.  
Each component (e.g., <code>integratedSystem</code>, <code>errormappingcomponent</code>) provides dynamic runtime functionality for external integrations, mappings, and route-based logic.
</p>

<hr/>

<h2>⚙️ Component Architecture</h2>

<p>Each custom Camel component follows the same structure:</p>

<pre><code>Component/
└── &lt;component-name&gt;/
    ├── pom.xml
    ├── src/
    │   ├── main/java/com/middleware/component/&lt;name&gt;/
    │   │   ├── &lt;Name&gt;Component.java
    │   │   ├── &lt;Name&gt;Endpoint.java
    │   │   ├── &lt;Name&gt;Producer.java
    │   │   ├── model/
    │   │   │   └── &lt;ModelClass&gt;.java
    │   │   └── service/
    │   │       └── &lt;BridgeService&gt;.java
    │   └── main/resources/META-INF/services/org/apache/camel/component/&lt;scheme&gt;
    └── target/generated-resources/camel-component/
</code></pre>

<h3>🧱 Key Classes</h3>
<table border="1" cellspacing="0" cellpadding="6">
<tr><th>File</th><th>Purpose</th></tr>
<tr><td><code>&lt;Name&gt;Component.java</code></td><td>Registers the component under its scheme (e.g. <code>@Component("errormappingcomponent")</code>) and creates endpoints dynamically.</td></tr>
<tr><td><code>&lt;Name&gt;Endpoint.java</code></td><td>Defines the Camel URI syntax and parameters (<code>@UriEndpoint</code>, <code>@UriParam</code>, <code>@UriPath</code>).</td></tr>
<tr><td><code>&lt;Name&gt;Producer.java</code></td><td>Contains the runtime logic executed when the component is invoked within a route.</td></tr>
<tr><td><code>&lt;BridgeService&gt;.java</code></td><td>Acts as a bridge between the Camel component and backend service layer (Spring Bean).</td></tr>
<tr><td><code>model/&lt;ModelClass&gt;.java</code></td><td>Represents the data structure exchanged between the backend and component.</td></tr>
</table>

<hr/>

<h2>🧩 Component Generation</h2>

<p>Each component is automatically described to Camel and Kaoto via the <strong><code>camel-component-maven-plugin</code></strong>.</p>

<h3>🔧 Maven Configuration</h3>

<p>Every component’s <code>pom.xml</code> includes:</p>

<pre><code>&lt;plugin&gt;
  &lt;groupId&gt;org.apache.camel&lt;/groupId&gt;
  &lt;artifactId&gt;camel-component-maven-plugin&lt;/artifactId&gt;
  &lt;version&gt;${camel.version}&lt;/version&gt;
  &lt;executions&gt;
    &lt;execution&gt;
      &lt;id&gt;generate-component-metadata&lt;/id&gt;
      &lt;phase&gt;process-classes&lt;/phase&gt;
      &lt;goals&gt;
        &lt;goal&gt;generate&lt;/goal&gt;
      &lt;/goals&gt;
    &lt;/execution&gt;
  &lt;/executions&gt;
&lt;/plugin&gt;
</code></pre>

<p>
The plugin scans the Java annotations (<code>@Component</code>, <code>@UriEndpoint</code>, etc.) and generates the following files:
</p>

<pre><code>target/generated-resources/camel-component/
 ├── META-INF/services/org/apache/camel/component/&lt;scheme&gt;
 ├── com/middleware/component/&lt;scheme&gt;.json
</code></pre>

<p>These files describe the component metadata, syntax, and parameters — used by <strong>Kaoto Designer</strong> to visualize and configure routes.</p>

<hr/>

<h2>🔗 Integration with Backend (Spring Boot)</h2>

<p>Each component has a Spring-side bridge service to connect the backend with the Camel runtime:</p>

<pre><code>@Bean(name = ErrorMappingBridgeService.BEAN_ID)
public ErrorMappingBridgeService errorMappingBridgeService() {
    return id -> backendService.getErrorMappingById(id)
        .map(dto -> new ErrorMappingDetail(...))
        .orElse(null);
}
</code></pre>

<p>The bean ID matches the one looked up dynamically in the Camel component:</p>

<pre><code>this.bridgeService = getCamelContext().getRegistry()
    .lookupByNameAndType(ErrorMappingBridgeService.BEAN_ID, ErrorMappingBridgeService.class);
</code></pre>

<p>This design allows the component to call backend services dynamically during route execution.</p>

<hr/>

<h2>🧾 Kaoto Designer Metadata (JSON)</h2>

<p>Each component also includes a JSON definition that allows Kaoto Designer to recognize and display it:</p>

<pre><code>{
  "component": {
    "name": "errormappingcomponent",
    "title": "Error Mapping Component",
    "scheme": "errormappingcomponent",
    "syntax": "errormappingcomponent",
    "javaType": "com.middleware.component.ErrorMappingComponent",
    "producerOnly": true
  },
  "properties": {
    "code": {
      "kind": "parameter",
      "type": "string",
      "required": true,
      "description": "The error mapping ID to fetch and apply."
    }
  }
}
</code></pre>

<p>This JSON is typically placed under:</p>

<pre><code>Component/&lt;component-name&gt;/src/generated/resources/com/middleware/component/&lt;scheme&gt;.json
</code></pre>

<hr/>

<h2>🎨 Kaoto Fork — Catalog Integration</h2>

<p>
Custom components are registered in Kaoto through a <strong>single consolidated catalog file</strong> in the fork.
Do not patch <code>node_modules</code> or <code>packages/ui/dist</code> manually — those are regenerated on install/build.
</p>

<h3>📁 Key paths (Kaoto-Fork repo)</h3>

<table border="1" cellspacing="0" cellpadding="6">
<tr><th>Path</th><th>Purpose</th></tr>
<tr>
  <td><code>Kaoto-Fork/packages/ui/custom-components/components.json</code></td>
  <td><strong>Source of truth</strong> — all custom component Kaoto definitions (one entry per scheme).</td>
</tr>
<tr>
  <td><code>Kaoto-Fork/packages/ui/scripts/inject-custom-components.mjs</code></td>
  <td>Merge script — injects entries from <code>components.json</code> into every <code>@kaoto/camel-catalog</code> aggregate components file.</td>
</tr>
<tr>
  <td><code>Kaoto-Fork/node_modules/@kaoto/camel-catalog/dist/camel-catalog/</code></td>
  <td>Runtime catalog loaded by Kaoto (updated automatically by the inject script).</td>
</tr>
<tr>
  <td><code>Kaoto-Fork/packages/ui/dist/camel-catalog/</code></td>
  <td>Built catalog copied into the UI bundle on <code>yarn build</code> (also receives injected components via the same script before build).</td>
</tr>
</table>

<h3>🧩 Current custom components in <code>components.json</code></h3>

<ul>
  <li><code>hakeem</code></li>
  <li><code>notification</code></li>
  <li><code>config</code></li>
  <li><code>integratedSystem</code></li>
  <li><code>integrationmapping</code></li>
  <li><code>errormappingcomponent</code></li>
  <li><code>errormapper</code></li>
</ul>

<h3>➕ Add or update a component in Kaoto</h3>

<ol>
  <li>Build/install the Camel component (see <strong>Build &amp; Install</strong> below).</li>
  <li>Copy or merge its generated JSON metadata into:
    <pre><code>Kaoto-Fork/packages/ui/custom-components/components.json
</code></pre>
    Use the component <code>scheme</code> as the top-level key (same pattern as existing entries).
  </li>
  <li>Re-inject into the catalog:
    <pre><code>cd Kaoto-Fork
yarn inject-custom-components
</code></pre>
    Or restart Kaoto — injection also runs automatically before <code>start</code> / <code>build</code>.
  </li>
  <li>Commit both the Java component and the updated <code>components.json</code>.</li>
</ol>

<h3>🖥️ Fresh clone — run Kaoto with custom components</h3>

<pre><code>git clone https://github.com/Mohammad-Obeid/Kaoto-Fork.git
cd Kaoto-Fork
yarn install          # runs postinstall → inject-custom-components
yarn workspace @kaoto/kaoto run start
</code></pre>

<p>Open <code>http://localhost:5173</code> and search the component catalog for your scheme (e.g. <code>integratedSystem</code>).</p>

<p>
If you cloned before pulling the latest <code>components.json</code>, run <code>yarn inject-custom-components</code> once, then start again.
</p>

<hr/>

<h2>🚀 Build & Install</h2>

<p>To build a new Kaoto component:</p>

<pre><code>cd Component/&lt;component-name&gt;
mvn clean install
</code></pre>

<p>Then include it in the main Middleware backend:</p>

<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;com.middleware.component&lt;/groupId&gt;
  &lt;artifactId&gt;camel-error-mapping&lt;/artifactId&gt;
  &lt;version&gt;1.0.0&lt;/version&gt;
&lt;/dependency&gt;
</code></pre>

<hr/>
