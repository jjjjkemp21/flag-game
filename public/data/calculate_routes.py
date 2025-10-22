import json
import os

def get_unvisited_neighbor_count(flag, flag_map, visited):
    """
    Helper function to count how many unvisited neighbors a flag has.
    This helps the greedy algorithm prioritize "open" routes.
    """
    if 'borders' not in flag:
        return 0
    
    count = 0
    for border_name in flag['borders']:
        # Check if the border exists in our map and has not been visited
        if border_name not in visited and border_name in flag_map:
            count += 1
    return count

def find_greedy_path_from(start_flag, flag_map):
    """
    Finds a single, very long path starting from start_flag using a
    greedy algorithm. It prioritizes neighbors with the most open borders.
    """
    path = []
    visited = set()
    current_flag = start_flag

    while current_flag:
        # Add the current country to our path and mark it as visited
        path.append(current_flag['country'])
        visited.add(current_flag['country'])
        
        neighbors = []
        if 'borders' not in current_flag:
            current_flag = None  # Island or end of line
            continue

        # Check all neighbors
        for border_name in current_flag['borders']:
            # If neighbor exists and we haven't visited it...
            if border_name not in visited and border_name in flag_map:
                neighbor_flag = flag_map[border_name]
                # ...count *its* unvisited neighbors
                unvisited_count = get_unvisited_neighbor_count(neighbor_flag, flag_map, visited)
                neighbors.append((neighbor_flag, unvisited_count))

        if not neighbors:
            current_flag = None  # Dead end
        else:
            # Greedy choice: Sort neighbors by their unvisited count, descending
            neighbors.sort(key=lambda x: x[1], reverse=True)
            # Pick the best one to travel to next
            current_flag = neighbors[0][0]
            
    return path

def calculate_all_longest_routes():
    """
    Main function to load, process, and save all routes.
    """
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Create full paths to the files, relative to the script
    input_filename = os.path.join(script_dir, 'flags.json')
    output_filename = os.path.join(script_dir, 'longest_routes.json')
    
    # --- 1. Load Data ---
    try:
        # Use utf-8 encoding for special characters in country names
        with open(input_filename, 'r', encoding='utf-8') as f:
            all_flags = json.load(f)
    except FileNotFoundError:
        print(f"Error: '{input_filename}' not found.")
        print(f"Please place this script in the same directory as 'flags.json'.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode '{input_filename}'. Check for syntax errors.")
        return

    # --- 2. Pre-process Data ---
    flag_map = {flag['country']: flag for flag in all_flags}
    all_routes = {}
    min_path_length = 10 # Define the minimum length

    print(f"Calculating longest route (min length {min_path_length}) for all starting countries...")

    # --- 3. Calculate Path for Every Country ---
    skipped_count = 0
    for start_flag in all_flags:
        country_name = start_flag['country']
        
        path = find_greedy_path_from(start_flag, flag_map)
        
        # --- THIS IS THE CHANGE ---
        # Only add the path if it meets the minimum length requirement
        if len(path) >= min_path_length:
            all_routes[country_name] = path
            print(f"  - {country_name}: Found path of {len(path)} countries")
        else:
            skipped_count += 1
            # Optional: print skipped countries
            # print(f"  - {country_name}: Skipped (path length {len(path)})")
            
    # --- 4. Save Results ---
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(all_routes, f, indent=2, ensure_ascii=False)
        
        print(f"\nSuccess! {len(all_routes)} routes saved to {output_filename}")
        if skipped_count > 0:
             print(f"Skipped {skipped_count} countries with paths shorter than {min_path_length}.")
        print("You can now copy this file into your React project.")
        
    except IOError as e:
        print(f"\nError: Could not write to file '{output_filename}'. {e}")

# --- Run the script ---
if __name__ == "__main__":
    calculate_all_longest_routes()