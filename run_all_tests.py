import os
import pytest

# Number of times to run each test file
num_runs = 25

# Define the directory where the test files are located
test_directory = "tests"

# Create a dictionary to store results
test_results = {}

def run_tests():
    # Find all test files in the 'tests' directory
    test_files = [f for f in os.listdir(test_directory) if f.startswith('test_') and f.endswith('.py')]
    
    # Initialize the test_results dictionary to store scores for each test file
    for test_file in test_files:
        test_results[test_file] = {'passed': 0, 'failed': 0}
    
    # Run each test file multiple times and track results
    for _ in range(num_runs):
        for test_file in test_files:
            # Run the test file with minimized output
            result = pytest.main([os.path.join(test_directory, test_file), '--maxfail=1', '--disable-warnings', '--capture=no'])
            if result == 0:  # 0 means all tests passed
                test_results[test_file]['passed'] += 1
            else:  # If any test fails, count it as a failure
                test_results[test_file]['failed'] += 1
    
    # After all runs, print a summary
    print("\nTest Results Summary:")
    for test_file, results in test_results.items():
        total_runs = num_runs
        passed = results['passed']
        failed = results['failed']
        print(f"{test_file}: {passed}/{total_runs} passed, {failed}/{total_runs} failed")
    print()

if __name__ == "__main__":
    run_tests()
