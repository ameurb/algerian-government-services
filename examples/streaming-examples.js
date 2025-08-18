// 🌊 Streaming API Examples - JavaScript
// Server-Sent Events (SSE) for real-time data streaming

class AlgerianServicesStreamingAPI {
  constructor(apiKey, baseUrl = 'http://api.findapply.com:8081') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Streaming search with real-time progress updates
   */
  async streamSearch(query, category = null, options = {}) {
    const { chunkSize = 1, onProgress, onResult, onComplete, onError } = options;
    
    const url = `${this.baseUrl}/stream/search`;
    const body = JSON.stringify({ query, category, chunkSize });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'text/event-stream'
        },
        body
      });

      if (!response.ok) {
        throw new Error(`Streaming failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'metadata':
                  console.log('🔍 Search started:', data.query);
                  break;
                  
                case 'progress':
                  console.log(`📊 ${data.message} (${data.progress}%)`);
                  onProgress?.(data);
                  break;
                  
                case 'result':
                  console.log(`📋 Chunk ${data.chunk + 1}/${data.totalChunks}:`, data.data.length, 'services');
                  onResult?.(data);
                  break;
                  
                case 'complete':
                  console.log(`✅ Complete: ${data.totalResults} services in ${data.queryTime}ms`);
                  onComplete?.(data);
                  return data;
                  
                case 'error':
                  console.error('❌ Stream error:', data.message);
                  onError?.(data);
                  throw new Error(data.message);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Real-time statistics streaming
   */
  async streamStats(onUpdate, onError) {
    const url = `${this.baseUrl}/stream/stats`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'text/event-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Stats streaming failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'stats_update') {
                console.log('📊 Stats update:', data.data);
                onUpdate?.(data.data);
              } else if (data.type === 'error') {
                console.error('❌ Stats error:', data.error);
                onError?.(data);
              }
            } catch (parseError) {
              console.warn('Failed to parse stats SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stats streaming error:', error);
      throw error;
    }
  }
}

// Usage Examples
async function streamingExamples() {
  const api = new AlgerianServicesStreamingAPI('dz_live_demo123');

  console.log('🌊 Streaming API Examples\n');

  try {
    // Example 1: Streaming search with progress tracking
    console.log('1. 🔍 Streaming Search with Progress...');
    
    await api.streamSearch('National ID', 'CIVIL_STATUS', {
      chunkSize: 2,
      onProgress: (data) => {
        console.log(`   Progress: ${data.progress}% - ${data.message}`);
      },
      onResult: (data) => {
        console.log(`   Received chunk ${data.chunk + 1}/${data.totalChunks}`);
        data.data.forEach(service => {
          console.log(`     • ${service.nameEn || service.name}`);
        });
      },
      onComplete: (data) => {
        console.log(`   ✅ Search complete: ${data.totalResults} services`);
      },
      onError: (error) => {
        console.error('   ❌ Search error:', error.message);
      }
    });

    // Example 2: Real-time statistics (run for 10 seconds)
    console.log('\n2. 📊 Real-time Statistics Streaming...');
    
    const statsPromise = api.streamStats(
      (stats) => {
        console.log(`   📈 Live stats: ${stats.total} total, ${stats.online} online`);
        console.log(`   📋 Categories: ${stats.byCategory.length} categories`);
      },
      (error) => {
        console.error('   ❌ Stats error:', error.error);
      }
    );

    // Stop stats streaming after 10 seconds
    setTimeout(() => {
      console.log('   ⏹️ Stopping stats stream...');
    }, 10000);

  } catch (error) {
    console.error('Streaming example failed:', error);
  }
}

// React component for streaming search (commented out for Node.js execution)
/*
function StreamingSearchComponent() {
  const [searchResults, setSearchResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [searching, setSearching] = useState(false);

  const handleStreamSearch = async (query) => {
    setSearching(true);
    setSearchResults([]);
    setProgress(0);

    const api = new AlgerianServicesStreamingAPI('dz_live_demo123');

    try {
      await api.streamSearch(query, null, {
        chunkSize: 1,
        onProgress: (data) => {
          setProgress(data.progress);
        },
        onResult: (data) => {
          setSearchResults(prev => [...prev, ...data.data]);
        },
        onComplete: () => {
          setSearching(false);
          setProgress(100);
        },
        onError: (error) => {
          console.error('Search error:', error);
          setSearching(false);
        }
      });
    } catch (error) {
      console.error('Streaming failed:', error);
      setSearching(false);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search services..."
        onKeyPress={(e) => e.key === 'Enter' && handleStreamSearch(e.target.value)}
      />
      
      {searching && (
        <div>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }}></div>
          </div>
          <p>Progress: {progress}%</p>
        </div>
      )}

      <div>
        {searchResults.map(service => (
          <div key={service.id}>
            <h3>{service.nameEn || service.name}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AlgerianServicesStreamingAPI };
} else {
  window.AlgerianServicesStreamingAPI = AlgerianServicesStreamingAPI;
}

// Run examples if executed directly
if (require.main === module) {
  streamingExamples();
}