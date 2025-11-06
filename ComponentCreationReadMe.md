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

<pre><code>src/generated/resources/com/middleware/component/&lt;scheme&gt;.json
</code></pre>

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
