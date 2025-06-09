Feature: Full Browser Interaction With Scenarios

  Scenario: Perform all basic browser actions
    Given I open the homepage
    When I enter "john" into the username field
    And I enter "doe123" into the password field
    And I click the login button
    Then I should see the dashboard message "Welcome back, John!"

  Scenario: Form validation with input clearing
    Given I open the login page
    When I enter "wronguser" into the username field
    And I clear the username field
    And I enter "admin" into the username field
    Then I should see the message "Username updated"

  Scenario: Element visibility and enabled checks
    Given I open the profile page
    Then the update button should be visible
    And the save button should be enabled
    And the delete button should be disabled

  Scenario: Page title and URL assertions
    Given I open the settings page
    Then the title should be "User Settings"
    And the url should contain "/settings"

  Scenario: Custom wait and scrolling
    Given I open the long form page
    When I scroll to the submit button
    And I wait for the form to be visible
    Then I should see the form header "Complete the Form"
