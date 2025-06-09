Feature: This is my login functionality for testing
  Scenario: This is my successful login
    Given I open the login page
    When I enter username in the username field
    When I enter password in the password field
    And I click on the login button
    Then I should see "Welcome Tom!" in the welcome message
