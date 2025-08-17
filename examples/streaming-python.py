#!/usr/bin/env python3
# 🌊 Streaming API Examples - Python
# Server-Sent Events (SSE) for real-time data streaming

import requests
import json
import time
from typing import Callable, Optional, Dict, Any

class AlgerianServicesStreamingAPI:
    """Python SDK for streaming Algerian Government Services API"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.findapply.com:8081"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}'
        })

    def stream_search(
        self, 
        query: str, 
        category: Optional[str] = None,
        chunk_size: int = 1,
        on_progress: Optional[Callable] = None,
        on_result: Optional[Callable] = None,
        on_complete: Optional[Callable] = None,
        on_error: Optional[Callable] = None
    ):
        """Stream search results with real-time progress"""
        
        url = f"{self.base_url}/stream/search"
        data = {'query': query, 'chunkSize': chunk_size}
        if category:
            data['category'] = category

        try:
            response = self.session.post(
                url,
                json=data,
                headers={'Accept': 'text/event-stream'},
                stream=True
            )
            response.raise_for_status()

            print(f"🔍 Starting streaming search for: {query}")
            
            all_results = []
            
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    try:
                        event_data = json.loads(line[6:])
                        
                        if event_data['type'] == 'metadata':
                            print(f"📋 Search metadata: {event_data['requestId']}")
                            
                        elif event_data['type'] == 'progress':
                            print(f"📊 {event_data['message']} ({event_data['progress']}%)")
                            if on_progress:
                                on_progress(event_data)
                                
                        elif event_data['type'] == 'result':
                            chunk_info = f"Chunk {event_data['chunk'] + 1}/{event_data['totalChunks']}"
                            print(f"📦 {chunk_info}: {len(event_data['data'])} services")
                            
                            for service in event_data['data']:
                                print(f"   • {service.get('nameEn', service['name'])}")
                                all_results.append(service)
                            
                            if on_result:
                                on_result(event_data)
                                
                        elif event_data['type'] == 'complete':
                            print(f"✅ Complete: {event_data['totalResults']} services in {event_data['queryTime']}ms")
                            if on_complete:
                                on_complete(event_data)
                            return all_results
                            
                        elif event_data['type'] == 'error':
                            print(f"❌ Error: {event_data['message']}")
                            if on_error:
                                on_error(event_data)
                            raise Exception(event_data['message'])
                            
                    except json.JSONDecodeError:
                        continue  # Skip invalid JSON lines

        except requests.exceptions.RequestException as e:
            print(f"❌ Streaming request failed: {e}")
            raise

    def stream_stats(
        self,
        duration: int = 10,
        on_update: Optional[Callable] = None,
        on_error: Optional[Callable] = None
    ):
        """Stream real-time statistics"""
        
        url = f"{self.base_url}/stream/stats"
        
        try:
            response = self.session.get(
                url,
                headers={'Accept': 'text/event-stream'},
                stream=True
            )
            response.raise_for_status()

            print(f"📊 Starting stats streaming for {duration} seconds...")
            start_time = time.time()
            
            for line in response.iter_lines(decode_unicode=True):
                # Stop after specified duration
                if time.time() - start_time > duration:
                    break
                    
                if line.startswith('data: '):
                    try:
                        event_data = json.loads(line[6:])
                        
                        if event_data['type'] == 'stats_update':
                            stats = event_data['data']
                            print(f"📈 Live stats: {stats['total']} total, {stats['online']} online")
                            
                            if on_update:
                                on_update(stats)
                                
                        elif event_data['type'] == 'error':
                            print(f"❌ Stats error: {event_data['error']}")
                            if on_error:
                                on_error(event_data)
                            
                    except json.JSONDecodeError:
                        continue

            print("⏹️ Stats streaming stopped")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Stats streaming failed: {e}")
            raise

def streaming_examples():
    """Example usage of streaming API"""
    
    api = AlgerianServicesStreamingAPI('mcp_live_demo123')
    
    print("🌊 Python Streaming API Examples\n")
    
    # Example 1: Progressive search results
    print("1. 🔍 Streaming Search Example...")
    
    def handle_progress(data):
        # You could update a progress bar here
        pass
    
    def handle_result(data):
        # Process each chunk as it arrives
        for service in data['data']:
            # Update UI with new service
            pass
    
    def handle_complete(data):
        print(f"   🎉 Search completed in {data['queryTime']}ms")
    
    try:
        results = api.stream_search(
            'National ID', 
            'CIVIL_STATUS',
            chunk_size=2,
            on_progress=handle_progress,
            on_result=handle_result,
            on_complete=handle_complete
        )
        
        print(f"   Final results: {len(results)} services\n")
        
    except Exception as e:
        print(f"   ❌ Streaming search failed: {e}\n")

    # Example 2: Real-time stats monitoring
    print("2. 📊 Real-time Statistics Streaming...")
    
    def handle_stats_update(stats):
        print(f"   📈 Update: {stats['total']} services, {len(stats['byCategory'])} categories")
    
    def handle_stats_error(error):
        print(f"   ❌ Stats error: {error['error']}")
    
    try:
        api.stream_stats(
            duration=6,  # Stream for 6 seconds
            on_update=handle_stats_update,
            on_error=handle_stats_error
        )
    except Exception as e:
        print(f"   ❌ Stats streaming failed: {e}")

    print("\n🎉 Streaming examples completed!")

# Advanced example: Real-time dashboard
class RealTimeDashboard:
    def __init__(self, api_key: str):
        self.api = AlgerianServicesStreamingAPI(api_key)
        self.stats = {}
        self.search_results = []
        
    def start_monitoring(self):
        """Start real-time monitoring dashboard"""
        print("🚀 Starting real-time dashboard...")
        
        # In a real application, you'd run this in a separate thread
        self.api.stream_stats(
            duration=30,
            on_update=self.update_dashboard,
            on_error=self.handle_error
        )
    
    def update_dashboard(self, stats):
        """Update dashboard with new stats"""
        self.stats = stats
        self.display_dashboard()
    
    def display_dashboard(self):
        """Display current dashboard state"""
        print("\n" + "="*50)
        print("📊 REAL-TIME DASHBOARD")
        print("="*50)
        
        if self.stats:
            print(f"📁 Total Services: {self.stats['total']}")
            print(f"🌐 Online Services: {self.stats['online']}")
            print(f"✅ Active Services: {self.stats['active']}")
            print("\n📋 By Category:")
            
            for category in self.stats['byCategory']:
                print(f"   • {category['category']}: {category['count']} services")
        
        print(f"\n🕒 Last Updated: {time.strftime('%H:%M:%S')}")
        print("="*50)
    
    def handle_error(self, error):
        print(f"❌ Dashboard error: {error}")

# Run examples if executed directly
if __name__ == "__main__":
    streaming_examples()
    
    # Uncomment to run real-time dashboard
    # dashboard = RealTimeDashboard('mcp_live_demo123')
    # dashboard.start_monitoring()